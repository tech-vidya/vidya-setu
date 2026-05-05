const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const seedData = require("./seedData");
dotenv.config();

const app = express();

// ================= CORS FIX (IMPORTANT) =================

const allowedOrigins = [
  "https://vidya-setu-ui.vercel.app", // ❗ NO trailing slash
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 👇 handle preflight
app.options("*", cors());

// ================= MIDDLEWARE =================
// app.get("/api/seed", async (req, res) => {
//   try {
//     console.log("🔥 Seed API hit");

//     if (req.query.key !== process.env.SEED_SECRET) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     console.log("🌱 Running seedData...");
//     await seedData();   // ✅ THIS WAS MISSING
//     console.log("✅ Seeding done");

//     res.json({
//       message: "✅ Database seeded successfully"
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "❌ Seeding failed",
//       error: error.message
//     });
//   }
// });

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= ROUTES =================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// ================= HEALTH =================

app.get('/api/health', (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message });
});

// ================= DB + SERVER =================

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // ✅ CHECK FLAG (important)
    const alreadySeeded = process.env.SEED_DONE === "true";

    if (!alreadySeeded) {
      console.log("🌱 Running seed...");

      await seedData();

      console.log("✅ Seeding done");

      // ⚠️ IMPORTANT: set env manually after first run
      // console.log("👉 अब .env me SEED_DONE=true set kar do");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })