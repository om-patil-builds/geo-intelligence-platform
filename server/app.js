const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const exportRoutes = require('./routes/exportRoutes');
const placeRoutes = require('./routes/placeRoutes');
const historyRoutes = require('./routes/historyRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Geo Intelligence Platform API is running"
  });
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 100),
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'geo-intelligence-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/places', placeRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/history', historyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
