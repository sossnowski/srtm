const express = require('express');
const logger = require('../../logger');
const elevationController = require('./elevationController');

const router = express.Router();

router.get('/point/:coordinates', async (req, res) => {
  try {
    const result = await elevationController.point(req.params.coordinates);
    logger.log('info', 'Getting point elevation', { message: `${result.point.lon}, ${result.point.lat}` });
    res.status(200).json({
      point: result.point,
      elevation: result.elevation
    });
  }
  catch (error) {
    logger.log('error', 'Getting point elevation', { message: error.message });
    res.status(500).json({
      error: {
        message: error.message
      }
    });
  }
});

router.get('/pointsArray', async (req, res) => {
  try {
    const result = await elevationController.pointsArray(req.body);
    logger.log('info', 'elevations array', { message: `getting elevations for ${result.length} points` });
    res.status(200).json({
      elevations: result
    });
  }
  catch (error) {
    logger.log('error', 'Getting point elevation', { message: error.message });
    res.status(500).json({
      error: {
        message: error.message
      }
    });
  }
});

router.get('/area/:distanceBetweenPoints', async (req, res) => {
  try {
    const result = await elevationController.area(req.body, req.params.distanceBetweenPoints);
    logger.log('info', 'Getting area elevation with point distance', {
      message: req.params.distanceBetweenPoints
    });
    res.status(200).json(result);
  }
  catch (error) {
    logger.log('error', 'Getting point elevation', { message: error.message });
    res.status(500).json({
      error: {
        message: error.message
      }
    });
  }
});

module.exports = router;
