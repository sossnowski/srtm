/* eslint-disable no-restricted-syntax */
const { TileSet } = require('node-hgt');
const lineChunk = require('@turf/line-chunk');
const nearestPoint = require('@turf/nearest-point-on-line').default;
const midPoint = require('@turf/midpoint');
const { lineString, polygon } = require('@turf/helpers');

/**
 * Translate coordinates presented in text to an object of lon and lat values.
 *
 * @param {String} coordinates Lat and Lon values in text
 * @returns {Object} {Lon, Lat} values
 */
module.exports.pointFromCoordinates = (coordinates) => {
  const splitedCoordinates = coordinates.split(',');
  if (splitedCoordinates.length !== 2) throw new Error('Point require exactly two coordinates');
  const pointGeometry = {
    lon: splitedCoordinates[1],
    lat: splitedCoordinates[0]
  };

  return pointGeometry;
};

/**
 * Get elevation for selected point.
 *
 * @param {Object} requestPoint Contains coordinates in {lat, lon} form.
 * @returns {Number} Elevation height.
 */
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

/**
 * Evaluate mesh points of given area.
 *
 * @param {Object} area Feature object.
 * @param {Number} pointDistance Length of a segment
 * @returns {Object} Contains every point coordinates.
 */
module.exports.getPointsGridOfArea = (area, pointDistance) => {
  if (area.geometry.type === 'LineString') return [];
  const { coordinates } = area.geometry;
  const midPoints = [];

  midPoints.push(midPoint(coordinates[0][4], coordinates[0][0]).geometry.coordinates);
  midPoints.push(midPoint(coordinates[0][1], coordinates[0][2]).geometry.coordinates);

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

/**
 * Evaluate elevation using mesh points returned by getPointsGridOfArea function.
 *
 * @param {Object} points Collection of mesh points.
 * @returns {Array} Elevation for every given point.
 */
module.exports.getElevationsFromPointsGrid = (points) => Promise.all(
  points.map((pointFromGrid) => this.getElevation({
    lat: pointFromGrid.geometry.coordinates[1],
    lon: pointFromGrid.geometry.coordinates[0]
  }))
);

/**
 * Gets max, min values of elevation and average elevation.
 *
 * @param {Array} elevationsArray Array of elevation measurements.
 * @returns {Object} Contains min, max values and average elevation of elevationsArray.
 */
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

/**
 * Splits given polygon by limiting single part height.
 *
 * @param {Object} polygonData Polygon feature.
 * @param {Object} polygonGeojson Geojson of polygon.
 * @param {Number} height Max height of part of splitted area.
 * @returns {Array} Splited polygon array with properties(minH, maxH, avg, amslH).
 */
module.exports.splitPolygon = (polygonData, polygonGeojson, height) => {
  const polygonHeights = {
    min: parseInt(polygonGeojson.properties.minHeight, 10),
    max: parseInt(polygonGeojson.properties.maxHeight, 10)
  };
  let referenceElevation = polygonData.elevations[0];
  const splitedPolygon = [];

  let polygonStartPoint;
  let polygonEndPoint;
  const lastPointsOfArea = [];

  const firstLine = lineString([
    polygonGeojson.geometry.coordinates[0][0],
    polygonGeojson.geometry.coordinates[0][1]
  ]);
  const secondLine = lineString([
    polygonGeojson.geometry.coordinates[0][2],
    polygonGeojson.geometry.coordinates[0][3]
  ]);

  ({ 0: { 0: polygonStartPoint } } = polygonGeojson.geometry.coordinates);
  ({ 0: { 3: polygonEndPoint } } = polygonGeojson.geometry.coordinates);

  lastPointsOfArea.push(
    polygonGeojson.geometry.coordinates[0][1],
    polygonGeojson.geometry.coordinates[0][2]
  );

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
        elevationMinM: minElevation,
        elevationMaxM: maxElevation,
        elevationAvgM: avg,
        aglMinM: polygonHeights.min,
        aglMaxM: polygonHeights.max,
        amslMinM: avg + polygonHeights.min,
        amslMaxM: avg + polygonHeights.max
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
    elevationMinM: minElevation,
    elevationMaxM: maxElevation,
    elevationAvgM: avg,
    aglMinM: polygonHeights.min,
    aglMaxM: polygonHeights.max,
    amslMinM: avg + polygonHeights.min,
    amslMaxM: avg + polygonHeights.max
  };

  return splitedPolygon;
};
