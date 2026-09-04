const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');

router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await MLClient.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

router.get('/health', async (req, res, next) => {
  try {
    const health = await MLClient.checkHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

router.post('/predict', async (req, res, next) => {
  try {
    const prediction = await MLClient.predict(req.body);
    res.json({ success: true, data: prediction });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
