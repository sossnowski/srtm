/* eslint-disable no-restricted-syntax */
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

module.exports.pointsArray = (coordinates) => {
  try {
    const elevations = elevationService.getElevationsFromPointsGrid(coordinates);

    return elevations;
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
    for (let i = 0; i < resolvedElevations.length; i += 1) {
      const splitedPolygons = elevationService.splitPolygon(
        resolvedElevations[i], polygons[i], height * partOfZoneHeight
      );
      result.push(...splitedPolygons);
    }

    const responseData = areasData;
    responseData.geojson.features = result;
    lineString.properties = {};
    responseData.geojson.features.push(lineString);

    return responseData;
  }
  catch (error) {
    throw new Error(error.message);
  }
};
