/* eslint-disable no-restricted-syntax */
const { TileSet } = require('node-hgt');
const bbox = require('@turf/bbox').default;
const pointsGrid = require('@turf/point-grid').default;
const lineChunk = require('@turf/line-chunk');
const nearestPoint = require('@turf/nearest-point-on-line').default;
const distance = require('@turf/distance').default;
const midPoint = require('@turf/midpoint');
const { lineString, point, polygon } = require('@turf/helpers');

module.exports.pointFromCoordinates = (coordinates) => {
  const splitedCoordinates = coordinates.split(',');
  if (splitedCoordinates.length !== 2) throw new Error('Point require exactly two coordinates');
  const point = {
    lon: splitedCoordinates[0],
    lat: splitedCoordinates[1]
  };

  return point;
};

module.exports.getElevation = (requestPoint) => {
  const tileset = new TileSet('./data/');
  return new Promise((resolve, reject) => {
    tileset.getElevation([requestPoint.lat, requestPoint.lon], (err, elevation) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(elevation);
      }
    });
  });
};

module.exports.getPointsGridOfArea = (area, pointDistance) => {
//   const bboxFromGeojson = bbox(area);
//   const pointsGridFromBbox = pointsGrid(bboxFromGeojson, distance, { units: 'meters' });

  //   return pointsGridFromBbox;
  const { coordinates } = area.geometry;
  const midPoints = [];
  if (
    distance(coordinates[0][0], coordinates[0][1])
        > distance(coordinates[0][1], coordinates[0][2])
  ) {
    midPoints.push(midPoint(coordinates[0][1], coordinates[0][2]).geometry.coordinates);
    midPoints.push(midPoint(coordinates[0][3], coordinates[0][4]).geometry.coordinates);
  }
  else {
    midPoints.push(midPoint(coordinates[0][0], coordinates[0][1]).geometry.coordinates);
    midPoints.push(midPoint(coordinates[0][2], coordinates[0][3]).geometry.coordinates);
  }
  const line = lineString(midPoints);

  const chunks = lineChunk(line, pointDistance, { units: 'meters' });
  const points = chunks.features.map((partialLine) => {
    const newObject = partialLine;
    newObject.geometry.type = 'Point';
    const [newCoordinate] = partialLine.geometry.coordinates;
    newObject.geometry.coordinates = newCoordinate;

    return newObject;
  });
  return points;
};

module.exports.getElevationsFromPointsGrid = (points) => Promise.all(
  points.map((pointFromGrid) => this.getElevation({
    lat: pointFromGrid.geometry.coordinates[1],
    lon: pointFromGrid.geometry.coordinates[0]
  }))
);

module.exports.getStatiticsDataFromElevationsArray = (elevationsArray) => {
  let counter = 0;
  let minMsl = Infinity;
  let maxMsl = 0;
  let sum = 0;

  for (const elevation of elevationsArray) {
    if (elevation > maxMsl) maxMsl = elevation;
    if (elevation < minMsl) minMsl = elevation;

    sum += elevation;
    counter += 1;
  }

  return {
    minMsl,
    maxMsl,
    averageMsl: sum / counter
  };
};

module.exports.splitPolygon = (polygonData, polygonGeojson, height) => {
  let referenceElevation = polygonData.elevations[0];
  const splitedPolygonsPoints = [];

  const distanceFromFirstToSecondPointOfPolygon = distance(
    point(polygonGeojson.geometry.coordinates[0][0]),
    point(polygonGeojson.geometry.coordinates[0][1])
  );

  const distanceFromSecondToThirdPointOfPolygon = distance(
    polygonGeojson.geometry.coordinates[0][1],
    polygonGeojson.geometry.coordinates[0][2]
  );

  let firstLine;
  let secondLine;
  let polygonStartPoint;
  let polygonEndPoint;
  const lastPointsOfArea = [];
  if (distanceFromFirstToSecondPointOfPolygon > distanceFromSecondToThirdPointOfPolygon) {
    firstLine = lineString([
      polygonGeojson.geometry.coordinates[0][0],
      polygonGeojson.geometry.coordinates[0][1]
    ]);
    secondLine = lineString([
      polygonGeojson.geometry.coordinates[0][2],
      polygonGeojson.geometry.coordinates[0][3]
    ]);

    polygonStartPoint = polygonGeojson.geometry.coordinates[0][0];
    polygonEndPoint = polygonGeojson.geometry.coordinates[0][3];

    lastPointsOfArea.push(
      polygonGeojson.geometry.coordinates[0][1],
      polygonGeojson.geometry.coordinates[0][2]
    );
  }
  else {
    firstLine = lineString([
      polygonGeojson.geometry.coordinates[0][1],
      polygonGeojson.geometry.coordinates[0][2]
    ]);
    secondLine = lineString([
      polygonGeojson.geometry.coordinates[0][3],
      polygonGeojson.geometry.coordinates[0][4]
    ]);

    polygonStartPoint = polygonGeojson.geometry.coordinates[0][1];
    polygonEndPoint = polygonGeojson.geometry.coordinates[0][4];

    lastPointsOfArea.push(
      polygonGeojson.geometry.coordinates[0][2],
      polygonGeojson.geometry.coordinates[0][3]
    );
  }

  for (let i = 1; i < polygonData.elevations.length; i += 1) {
    // console.log(Math.abs(referenceElevation - polygon.elevations[i]));
    if (Math.abs(referenceElevation - polygonData.elevations[i]) > height) {
      console.log(Math.abs(referenceElevation - polygonData.elevations[i]));

      const firstExtraPoint = nearestPoint(
        firstLine, polygonData.points[i]
      ).geometry.coordinates;
      const secondExtraPoint = nearestPoint(
        secondLine, polygonData.points[i]
      ).geometry.coordinates;

      splitedPolygonsPoints.push(polygon([[
        polygonStartPoint,
        firstExtraPoint,
        secondExtraPoint,
        polygonEndPoint,
        polygonStartPoint
      ]]));

      //   splitedPolygonsPoints.push(newPolygon);
      //   console.log(splitedPolygonsPoints);
      referenceElevation = polygonData.elevations[i];
      polygonStartPoint = firstExtraPoint;
      polygonEndPoint = secondExtraPoint;
    }
  }
  splitedPolygonsPoints.push(polygon([[
    polygonStartPoint,
    lastPointsOfArea[0],
    lastPointsOfArea[1],
    polygonEndPoint,
    polygonStartPoint
  ]]));
  return splitedPolygonsPoints;
};
