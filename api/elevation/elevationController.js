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
    const allAreasMinMsl = Infinity;
    const allAreasMaxMsl = 0;
    const sum = 0;
    const counter = 0;

    const height = areasData.max - areasData.min;
    const partOfZoneHeight = 1 / 2;

    const elevationsPromise = areasData.geojson.features.map(async (area, index) => {
      const pointsGrid = elevationService.getPointsGridOfArea(area, distance, index);

      const elevations = await elevationService.getElevationsFromPointsGrid(pointsGrid);
      return { elevations, points: pointsGrid };
    });
    const resolvedElevations = await Promise.all(elevationsPromise);

    const result = [];
    resolvedElevations.forEach((polygon, index) => {
    //   console.log(polygon);
      const splitedPolygons = elevationService.splitPolygon(
        polygon, areasData.geojson.features[index], 3
      );
      result.push(splitedPolygons);
    });

    // if (countedValues.maxMsl - countedValues.minMsl > height * partOfZoneHeight) {
    //     elevationService.splitPolygon(area, pointsGrid, height);
    //   }
    //   area.properties = { ...area.properties, ...countedValues };

    //   if (countedValues.maxMsl > allAreasMaxMsl) allAreasMaxMsl = countedValues.maxMsl;
    //   if (countedValues.minMsl < allAreasMinMsl) allAreasMinMsl = countedValues.minMsl;
    //   sum += countedValues.averageMsl;
    //   counter += 1;

    // return {
    //   allAreasMaxMsl,
    //   allAreasMinMsl,
    //   allAreasAverageMslLevel: sum / counter,
    //   geojson: areasData.geojson
    // };
    return result;
  }
  catch (error) {
    throw new Error(error.message);
  }
};
