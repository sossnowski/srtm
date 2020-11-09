const { TileSet } = require('node-hgt');
const bbox = require('@turf/bbox').default;
const pointsGrid = require('@turf/point-grid').default;

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
    tileset.getElevation([point.lat, point.lon], (err, elevation) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(elevation);
      }
    });
  });
};

module.exports.getPointsGridOfArea = (area, distance) => {
        const bboxFromGeojson = bbox(area)
        const pointsGridFromBbox = pointsGrid(bboxFromGeojson, distance, {units: 'meters'})

        return pointsGridFromBbox
};

module.exports.getDataFromPointsGrid = async (pointsGrid) => {
    let counter = 0;
    let minMsl = Infinity;
    let maxMsl = 0;
    let sum = 0;
    for (const point of pointsGrid.features) {
        const elevation = await this.getElevation({
            lat: point.geometry.coordinates[1],
            lon: point.geometry.coordinates[0]
        })
        
        if (elevation > maxMsl ) maxMsl = elevation;
        if (elevation < minMsl ) minMsl = elevation;

        sum += elevation;
        counter += 1;
    }

    return {
        minMsl,
        maxMsl,
        averageMsl: sum / counter
    }
}
