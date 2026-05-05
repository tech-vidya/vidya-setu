const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const progressRoutes = require('./routes/progressRoutes');
const userRoutes = require('./routes/userRoutes');

// Import error handler middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// ================= MIDDLEWARE =================
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

app.use(cors({
  origin: 'https://vidya-setu-ui.vercel.app/',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================= STATIC FILES =================

// uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 👉 IMPORTANT: serve Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// ================= API ROUTES =================

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);

// ================= HEALTH CHECK =================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'VidyaSetu API is running',
    timestamp: new Date().toISOString()
  });
});

// ================= SPA FALLBACK =================
// 👇 MOST IMPORTANT (fixes 404 for React routes & assets)

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ================= ERROR HANDLER =================

app.use(errorHandler);

// ================= DATABASE =================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// ================= GLOBAL ERROR =================

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;