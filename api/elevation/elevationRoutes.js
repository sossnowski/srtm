const { TileSet } = require('node-hgt');

const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
  let result;
  var tileset = new TileSet('./data/');
  tileset.getElevation([51.9, 19.6], (err, elevation) => {
    if (err) {
      console.log(`getElevation failed: ${err.message}`);
    }
    else {
      result = elevation;
      console.log(elevation);
      res.status(200).json({
        elevation: result
      });
    }
  });
});

module.exports = router;
