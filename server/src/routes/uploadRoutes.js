import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // assumes the default export is the configured instance

const router = express.Router();

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/products",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

// Multer upload middleware with file limits and error handling
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
    }
  },
});

/**
 * @route POST /api/upload/
 * @desc Upload a single image to Cloudinary
 * @access Private/Admin
 */
router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    console.log("Received file:", req.file); // Log req.file for debugging

    try {
      if (!req.file || !req.file.path) {
        return res.status(400).json({ success: false, error: "No image file provided" });
      }
      // The file object returned by multer-storage-cloudinary includes a path field with the Cloudinary URL
      console.log("Cloudinary upload result:", req.file); // logs Cloudinary upload result

      return res.status(201).json({
        success: true,
        imageUrl: req.file.path, // Cloudinary secure URL
      });
    } catch (err) {
      // Robust error logging
      console.error("Upload route error:", err);

      if (err instanceof multer.MulterError) {
        let message = "File upload error";
        if (err.code === "LIMIT_FILE_SIZE") message = "Image exceeds 5MB size limit";
        if (err.code === "LIMIT_UNEXPECTED_FILE") message = "Only image files are allowed";
        return res.status(400).json({ success: false, error: message });
      }

      // catch-all error handler
      return res.status(500).json({
        success: false,
        error: "Image upload failed",
        details: err.message ?? err.toString(),
      });
    }
  }
);

export default router;