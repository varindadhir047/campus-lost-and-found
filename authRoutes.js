
const express = require("express");
const router = express.Router();

const {
  signup,
  login
} = require("../controllers/authController");

// Student Signup API
router.post("/auth/signup", signup);

// Student Login API
router.post("/auth/login", login);

module.exports = router;
