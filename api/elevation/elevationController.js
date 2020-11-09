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

module.exports.area = async (geojson, distance) => {
    try {
        let allAreasMinMsl = Infinity;
        let allAreasMaxMsl = 0;
        let sum = 0;
        let counter = 0;

        for (const area of geojson.features) {
            const pointsGrid = elevationService.getPointsGridOfArea(area, distance)
            const countedValues = await elevationService.getDataFromPointsGrid(pointsGrid)

            area.properties = {...area.properties, ...countedValues}

            if (countedValues.maxMsl > allAreasMaxMsl) allAreasMaxMsl = countedValues.maxMsl
            if (countedValues.minMsl < allAreasMinMsl) allAreasMinMsl = countedValues.minMsl
            sum += countedValues.averageMsl
            counter += 1;

        }

        return {
            allAreasMaxMsl,
            allAreasMinMsl,
            allAreasAverageMslLevel: sum / counter,
            geojson
        }
    } catch (error) {
        throw new Error(error.message)
    }
}
