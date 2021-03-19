const elevationService = require('./elevationService');

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

module.exports.pointsArray = (coordinates) => {
  try {
    const elevations = elevationService.getElevationsFromPointsGrid(coordinates);

    return elevations;
  }
  catch (error) {
    throw new Error(error.message);
  }
};
