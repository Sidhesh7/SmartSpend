const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/stats', analyticsController.getDashboardStats);
router.get('/fraud-trends', analyticsController.getFraudTrends);
router.get('/risk-distribution', analyticsController.getRiskDistribution);
router.get('/type-breakdown', analyticsController.getTypeBreakdown);
router.get('/recent-alerts', analyticsController.getRecentAlerts);

module.exports = router;
