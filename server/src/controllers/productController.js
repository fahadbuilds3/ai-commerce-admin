import asyncHandler from "express-async-handler";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../services/productService.js";

import ApiError from "../utils/ApiError.js";

// CREATE PRODUCT CONTROLLER
export const createProduct = asyncHandler(async (req, res, next) => {
  try {
    const product = await createProductService(req.body);

    res.status(201).json({
      success: true,
      product,
      message: "Product created successfully",
    });
  } catch (err) {
    next(
      new ApiError(400, err.message || "Failed to create product")
    );
  }
});

// GET ALL PRODUCTS CONTROLLER
export const getProducts = asyncHandler(async (req, res, next) => {
  try {
    const products = await getProductsService();

    res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    next(
      new ApiError(500, err.message || "Failed to fetch products")
    );
  }
});

// GET PRODUCT BY ID CONTROLLER
export const getProductById = asyncHandler(async (req, res, next) => {
  try {
    const product = await getProductByIdService(req.params.id);

    if (!product) {
      return next(
        new ApiError(404, "Product not found")
      );
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(
      new ApiError(500, err.message || "Failed to fetch product")
    );
  }
});

/**
 * UPDATE PRODUCT CONTROLLER (FormData-compatible, debug logs, image-safe)
 * Handles both cases:
 * - With new image: Accepts multipart FormData, uploads/sets new image.
 * - Without image: Keeps existing imageUrl.
 * All fields validated, clear error messages, logs body/file/payload.
 * Req body: FormData, keys: name, description, price, stock, sku, category, slug, (optional image file).
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  try {
    const id = req.params.id;

    // Log incoming form data (excluding raw file buffer)
    const logObj = {
      fields: { ...req.body },
      file: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            // omit buffer
          }
        : null,
    };
    console.log(`[UPDATE PRODUCT] id=${id} | req.body=`, logObj.fields);
    if (logObj.file) {
      console.log(`[UPDATE PRODUCT] Received file:`, logObj.file);
    }

    // 1. Retrieve the current product to keep current image if none sent
    const existingProduct = await getProductByIdService(id);
    if (!existingProduct) {
      return next(new ApiError(404, "Product not found"));
    }
    // 2. Parse/validate required fields (all coming as strings due to multipart)
    // (use explicit string cast to prevent null/undefined)
    const {
      name = "",
      description = "",
      price = "",
      stock = "",
      sku = "",
      category = "",
      slug = "",
    } = req.body ?? {};

    // Validate required fields
    const errors = [];
    if (!name.trim()) errors.push("Product name is required");
    if (!price || isNaN(Number(price))) errors.push("Valid price required");
    if (!stock || isNaN(Number(stock))) errors.push("Valid stock required");
    if (!sku.trim()) errors.push("SKU required");
    if (!category.trim()) errors.push("Category required");

    if (errors.length > 0) {
      return next(new ApiError(400, errors.join("; ")));
    }

    // 3. Prepare update payload
    let imageUrl;
    if (req.file && req.file.cloudinaryUrl) {
      // (multer/cloudinary middleware attaches req.file.cloudinaryUrl)
      imageUrl = req.file.cloudinaryUrl;
    } else if (req.body.imageUrl && typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()) {
      // In case FormData includes imageUrl and NOT an actual file
      imageUrl = req.body.imageUrl.trim();
    } else {
      imageUrl = existingProduct.imageUrl || "";
    }

    // 4. Construct the update payload. Only set values that are actually present and changed.
    // Numbers: parse
    const updatePayload = {
      name: name.trim(),
      description: description?.trim() ?? "",
      price: Number(price),
      stock: Number(stock),
      sku: sku.trim(),
      category: category.trim(),
      slug: slug?.trim() ?? "",
      imageUrl,
    };

    // Remove undefined/empty fields (never update to blank unintentionally)
    Object.keys(updatePayload).forEach((key) => {
      // Keep 0 for numbers; remove only if truly blank string and not required.
      if (
        (typeof updatePayload[key] === "string" && updatePayload[key] === "" && !["name", "sku", "category"].includes(key)) ||
        updatePayload[key] === undefined
      ) {
        delete updatePayload[key];
      }
    });

    // Debug: Logging what will be sent to prisma
    console.log(`[UPDATE PRODUCT] Prisma payload:`, updatePayload);

    // 5. Perform update via service
    const updatedProduct = await updateProductService(id, updatePayload);

    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error("[UPDATE PRODUCT] Error:", err);
    // Multer/Middleware validation error
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "Image too large"));
    }
    // Prisma error-handling
    if (err.code === "P2025" || err.message?.includes?.("Record to update does not exist")) {
      return next(new ApiError(404, "Product not found"));
    }
    if (err.name === "PrismaClientKnownRequestError") {
      return next(
        new ApiError(400, "Failed to update product (Prisma error): " + err.message)
      );
    }
    next(
      new ApiError(400, err.message || "Failed to update product")
    );
  }
});

// DELETE PRODUCT CONTROLLER (DEBUGGED & PRODUCTION-READY)
export const deleteProduct = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Temporary logging for debugging
    console.log(`[DELETE PRODUCT] Received id:`, id);

    // Check if id is present and a string/number
    if (!id) {
      return next(new ApiError(400, "Product id parameter is required"));
    }

    // Optionally: validate UUID/format if needed for DB

    // Delete operation through service, expect service to throw if not found
    const result = await deleteProductService(id);

    // If service returns some indicator for not-found
    if (result === null || result === undefined) {
      return next(new ApiError(404, "Product not found or already deleted"));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      id,
    });
  } catch (err) {
    // Prisma "not found" error code handling
    if (
      err.code === "P2025" ||
      err.message?.includes?.("Record to delete does not exist")
    ) {
      return next(new ApiError(404, "Product not found"));
    }
    // General Prisma error
    if (err.name === "PrismaClientKnownRequestError") {
      return next(
        new ApiError(400, "Failed to delete product (Prisma error): " + err.message)
      );
    }
    next(
      new ApiError(400, err.message || "Failed to delete product")
    );
  }
});