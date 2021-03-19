/* eslint-disable no-restricted-syntax */
const { TileSet } = require('node-hgt');

module.exports.pointFromCoordinates = (coordinates) => {
  const splitedCoordinates = coordinates.split(',');
  if (splitedCoordinates.length !== 2) throw new Error('Point require exactly two coordinates');
  const pointGeometry = {
    lon: splitedCoordinates[1],
    lat: splitedCoordinates[0]
  };

  return pointGeometry;
};

module.exports.getElevation = (requestPoint) => {
  const tileset = new TileSet('./data/');
  return new Promise((resolve, reject) => {
    tileset.getElevation([requestPoint.lat, requestPoint.lon], (err, elevation) => {
      if (err) {
        reject(err);
      }
      else {
        resolve({
          elevation,
          coordinates: [requestPoint.lat, requestPoint.lon]
        });
      }
    });
  });
};

module.exports.getElevationsFromPointsGrid = (points) => {
  const allPromises = [];
  for (const point of points) {
    allPromises.push(this.getElevation({
      lat: point[1],
      lon: point[0]
    }));
  }

  return Promise.all(allPromises);
};
