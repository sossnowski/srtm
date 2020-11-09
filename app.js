const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const elevationRoutes = require('./api/elevation/elevationRoutes');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }
  next();
});

app.use('/elevation', elevationRoutes);

app.use((error, req, res) => {
  console.log('aaaa', error);
  if (error) {
    res.status(error.status || 500).json({
      error: {
        message: error.message
      }
    });
  }
  else {
    res.status(404).json({
      error: {
        message: 'Not Found'
      }
    });
  }
});

module.exports = app;
