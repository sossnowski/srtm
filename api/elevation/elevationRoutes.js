const express = require('express');
const logger = require('../../logger');
const elevationController = require('./elevationController');

const router = express.Router();

router.get('/point/:coordinates', async (req, res) => {
  try {
    const result = await elevationController.point(req.params.coordinates);
    logger.log('info', 'Getting point elevation', { message: req.params.coordinates });
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

module.exports = router;
