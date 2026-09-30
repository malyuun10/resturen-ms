require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const seedInitialData = require('./utils/seeder');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow all local origins (localhost:5173, 127.0.0.1, etc.)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Restaurant POS & Management System (Offline-First)'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint "${req.originalUrl}" not found.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Database connection and start server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`  RESTAURANT MANAGEMENT SYSTEM BACKEND ONLINE         `);
      console.log(`  Local API Server: http://localhost:${PORT}          `);
      console.log(`  MongoDB: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_management'}`);
      console.log(`  Offline POS Ready: Role-Based Admin & Cashier Active`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
