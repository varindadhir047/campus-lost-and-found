

const express = require("express");
const router = express.Router();

const {
  createItem,
  getItems,
  deleteItem
} = require("../controllers/itemController");

const {
  getItemMatches
} = require("../controllers/matchController");

const {
  protect
} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
// Create report — login required

router.post(
  "/items",
  protect,
  upload.single("photo"),
  createItem
);


// Browse reports — public
router.get("/items", getItems);

// Smart matching — public
router.get("/items/:id/matches", getItemMatches);

// Delete report — login required
router.delete("/items/:id", protect, deleteItem);

module.exports = router;
