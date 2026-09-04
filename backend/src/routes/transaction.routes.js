const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

// Public/Analyst read routes
router.get('/', transactionController.getTransactions);
router.get('/export/csv', transactionController.exportCsv);
router.get('/:id', transactionController.getTransactionById);

// Create / Ingest / Score transaction (Real-time fraud classification)
router.post('/', transactionController.createTransaction);
router.post('/batch', transactionController.batchIngest);

// Update status (Approve / Flag / Block / Review) - optionally authenticated or open for demo
router.patch('/:id/status', transactionController.updateStatus);

module.exports = router;
