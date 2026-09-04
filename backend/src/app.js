const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const modelRoutes = require('./routes/model.routes');
const graphRoutes = require('./routes/graph.routes');

const app = express();

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/graph', graphRoutes);
// Legacy compatibility endpoint from plan
app.use('/api/dashboard', analyticsRoutes);
app.post('/api/predict', (req, res, next) => {
  const MLClient = require('./services/mlClient');
  MLClient.predict(req.body)
    .then(data => res.json({ success: true, data }))
    .catch(next);
});

// Root & Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SmartSpend Node.js API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Fallback Error Handler
app.use(errorHandler);

module.exports = app;
