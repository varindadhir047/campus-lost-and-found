
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    typeof authHeader !== "string" ||
    !/^Bearer\s+\S+$/i.test(authHeader)
  ) {
    return res.status(401).json({
      message: "Not authorized. Please login."
    });
  }

  const token = authHeader.split(/\s+/)[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  if (
    !decoded ||
    typeof decoded.id !== "string" ||
    !mongoose.isValidObjectId(decoded.id)
  ) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }

  try {
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists. Please login again."
      });
    }

    req.user = user;
    return next();

  } catch (error) {
    console.error("Authentication database error:", error.message);

    return res.status(500).json({
      message: "Authentication service unavailable"
    });
  }
};

module.exports = { protect };
