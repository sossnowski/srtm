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
  const pointGeometry = {
    lon: splitedCoordinates[0],
    lat: splitedCoordinates[1]
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
        resolve(elevation);
      }
    });
  });
};

module.exports.getPointsGridOfArea = (area, pointDistance) => {
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
  const splitedPolygon = [];

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

    ({ 0: { 0: polygonStartPoint } } = polygonGeojson.geometry.coordinates);
    ({ 0: { 3: polygonEndPoint } } = polygonGeojson.geometry.coordinates);

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

    ({ 0: { 1: polygonStartPoint } } = polygonGeojson.geometry.coordinates);
    ({ 0: { 4: polygonEndPoint } } = polygonGeojson.geometry.coordinates);

    lastPointsOfArea.push(
      polygonGeojson.geometry.coordinates[0][2],
      polygonGeojson.geometry.coordinates[0][3]
    );
  }

  let polygonElevations = [];
  polygonElevations.push(polygonData.elevations[0]);

  for (let i = 1; i < polygonData.elevations.length; i += 1) {
    polygonElevations.push(polygonData.elevations[i]);
    if (Math.abs(referenceElevation - polygonData.elevations[i]) > height) {
      const firstExtraPoint = nearestPoint(
        firstLine, polygonData.points[i]
      ).geometry.coordinates;
      const secondExtraPoint = nearestPoint(
        secondLine, polygonData.points[i]
      ).geometry.coordinates;

      splitedPolygon.push(polygon([[
        polygonStartPoint,
        firstExtraPoint,
        secondExtraPoint,
        polygonEndPoint,
        polygonStartPoint
      ]]));

      const maxElevation = Math.max(...polygonElevations);
      const minElevation = Math.min(...polygonElevations);
      const sum = polygonElevations.reduce((a, b) => a + b, 0);
      const avg = sum / polygonElevations.length;

      polygonElevations = [];

      splitedPolygon[splitedPolygon.length - 1].properties = {
        minElevation,
        maxElevation,
        avg
      };

      referenceElevation = polygonData.elevations[i];
      polygonStartPoint = firstExtraPoint;
      polygonEndPoint = secondExtraPoint;
    }
  }
  splitedPolygon.push(polygon([[
    polygonStartPoint,
    lastPointsOfArea[0],
    lastPointsOfArea[1],
    polygonEndPoint,
    polygonStartPoint
  ]]));

  const maxElevation = Math.max(...polygonElevations);
  const minElevation = Math.min(...polygonElevations);
  const sum = polygonElevations.reduce((a, b) => a + b, 0);
  const avg = sum / polygonElevations.length;

  polygonElevations = [];

  splitedPolygon[splitedPolygon.length - 1].properties = {
    minElevation,
    maxElevation,
    avg
  };

  return splitedPolygon;
};
