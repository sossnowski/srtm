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
    const result = await elevationService.getElevation(point);
    return result;
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
module.exports.pointsArray = (coordinates) => {
  const elevations = elevationService.getElevationsFromPointsGrid(coordinates);

  return elevations;
};
