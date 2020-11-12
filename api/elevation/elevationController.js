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
      result.push(splitedPolygons);
    });

    return result;
  }
  catch (error) {
    throw new Error(error.message);
  }
};
