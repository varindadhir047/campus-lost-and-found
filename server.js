const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// CORS configuration
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500"
)
  .split(",")
  .map(origin => origin.trim());

app.use(
  cors({
    origin: allowedOrigins
  })
);

// Parse JSON requests
app.use(express.json({ limit: "1mb" }));


app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// API routes

app.use("/api", healthRoutes);

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.use("/api", authRoutes);
app.use("/api", itemRoutes);


// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request"
    });
  }

  res.status(500).json({
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Findly API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
}

start();

