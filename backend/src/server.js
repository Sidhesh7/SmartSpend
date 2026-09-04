require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` SmartSpend Node.js Backend API Server`);
  console.log(` Running on port: http://localhost:${PORT}`);
  console.log(` Health check:    http://localhost:${PORT}/api/health`);
  console.log(` Environment:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
