const elevationService = require('./elevationService');

module.exports.point = async (coordinates) => {
  const point = elevationService.pointFromCoordinates(coordinates);
  try {
    const elevation = await elevationService.getElevation(point);
    return { point, elevation };
  }
  catch (error) {
    throw new Error(error.message);
  }
};

module.exports.area = async (areasData, distance) => {
  try {
    const lineString = areasData.geojson.features.find((area) => area.geometry.type === 'LineString');
    const polygons = areasData.geojson.features.filter((area) => area.geometry.type !== 'LineString');
    const height = areasData.max - areasData.min;
    const partOfZoneHeight = 1 / 2;

    const elevationsPromise = polygons.map(async (area) => {
      const pointsGrid = elevationService.getPointsGridOfArea(area, distance);
      const elevations = await elevationService.getElevationsFromPointsGrid(pointsGrid);
      return { elevations, points: pointsGrid };
    });
    const resolvedElevations = await Promise.all(elevationsPromise);

    const result = [];
    resolvedElevations.forEach((polygon, index) => {
      const splitedPolygons = elevationService.splitPolygon(
        polygon, polygons[index], height * partOfZoneHeight
      );
      result.push(
        // eslint-disable-next-line no-return-assign, no-param-reassign
        ...splitedPolygons.map((polygonLeg) => polygonLeg.properties = {
          ...polygon.properties,
          min: areasData.min,
          max: areasData.max
        })
      );
    });

    const responseData = areasData;
    responseData.geojson.features = result;
    responseData.geojson.features.push(lineString);

    return responseData;
  }
  catch (error) {
    throw new Error(error.message);
  }
};
