
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    zone: {
      type: String,
      enum: [
        "Main Gate",
        "Admin Block",
        "Academic Block",
        "Library",
        "Cafeteria",
        "Sports Complex",
        "Hostel A",
        "Hostel B",
        "Parking"
      ],
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000
    },

    contact: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "Contact through registered email"
    },

    imageUrl: {
       type: String,
       default: null
    },


    status: {
      type: String,
      enum: ["open", "claimed", "verified", "closed"],
      default: "open"
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
