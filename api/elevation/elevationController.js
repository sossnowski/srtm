/* eslint-disable no-restricted-syntax */
const elevationService = require('./elevationService');

/**
 * Gets specific point and elevation for this point.
 *
 * @param {Tuple} coordinates Coordinates of a point.
 * @returns {Object} Consist of specific point and evaluated elevation.
 */
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

/**
 * Gets grid points of specific area and evaluate elevation for every part of this area.
 *
 * @param {Object} areasData Object containing data about area.
 * @param {Number} distance Segments length
 * @returns {Object} Contains updated with new features areasData object.
 */
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
