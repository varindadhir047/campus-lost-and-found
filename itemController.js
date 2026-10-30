
const mongoose = require("mongoose");
const Item = require("../models/Item");
const fs = require("fs").promises;
const path = require("path");

const createItem = async (req, res) => {
  try {
    const {
      type,
      title,
      category,
      color,
      zone,
      date,
      description,
      contact
    } = req.body;

    // Check required text fields
    const requiredFields = {
      type,
      title,
      category,
      color,
      zone,
      description
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          message: `${field} is required`
        });
      }
    }

    // Validate date
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        message: "Enter a valid report date"
      });
    }

    const reportDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(reportDate.getTime()) ||
      reportDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message: "Invalid calendar date"
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (date > today) {
      return res.status(400).json({
        message: "Report date cannot be in the future"
      });
    }

    // Validate optional contact
    if (contact != null && typeof contact !== "string") {
      return res.status(400).json({
        message: "Invalid contact information"
      });
    }

    const item = await Item.create({
      type: type.trim(),
      title: title.trim(),
      category: category.trim(),
      color: color.trim(),
      zone: zone.trim(),
      date: reportDate,
      description: description.trim(),
      ...(contact && contact.trim()
        ? { contact: contact.trim() }
        : {}),
      
     reportedBy: req.user._id,
     imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
status: "open"

    });

    return res.status(201).json({
      message: "Item reported successfully",
      item
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];

      return res.status(400).json({
        message: firstError?.message || "Invalid report details"
      });
    }

    console.error("Create item error:", error.message);

    return res.status(500).json({
      message: "Could not save report"
    });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .sort({ createdAt: -1 });

    return res.status(200).json(items);

  } catch (error) {
    console.error("Get items error:", error.message);

    return res.status(500).json({
      message: "Could not load reports"
    });
  }
};


const deleteItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid report ID"
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Report not found"
      });
    }

    // Only the report owner can delete it
    if (
      !item.reportedBy ||
      !item.reportedBy.equals(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only delete your own reports"
      });
    }

    // First delete the report from MongoDB
    await Item.findByIdAndDelete(item._id);

    // Then delete its uploaded photo, if present
    if (item.imageUrl) {
      const filename = path.basename(item.imageUrl);
      const photoPath = path.join(__dirname, "../uploads", filename);

      try {
        await fs.unlink(photoPath);
        console.log("Deleted report photo:", filename);
      } catch (fileError) {
        if (fileError.code !== "ENOENT") {
          console.error("Photo cleanup error:", fileError.message);
        }
      }
    }

    return res.status(200).json({
      message: "Report and associated photo deleted successfully"
    });

  } catch (error) {
    console.error("Delete item error:", error.message);

    return res.status(500).json({
      message: "Could not delete report"
    });
  }
};


module.exports = {
  createItem,
  getItems,
  deleteItem
};

