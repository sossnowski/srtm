const { TileSet } = require('node-hgt');

module.exports.pointFromCoordinates = (coordinates) => {
  const splitedCoordinates = coordinates.split(',');
  if (splitedCoordinates.length !== 2) throw new Error('Point require exactly two coordinates');
  const point = {
    lon: splitedCoordinates[0],
    lat: splitedCoordinates[1]
  };

  return point;
};

module.exports.getElevation = (point) => {
  const tileset = new TileSet('./data/');
  return new Promise((resolve, reject) => {
    tileset.getElevation([point.lat, point.lo], (err, elevation) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(elevation);
      }
    });
  });
};
