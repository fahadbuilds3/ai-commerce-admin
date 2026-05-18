import {
  body,
  validationResult,
} from "express-validator";

export const productValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Product name is required"
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Product name must be between 2 and 100 characters"
    ),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage(
      "Price must be a positive number"
    )
    .toFloat(),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage(
      "Stock must be a non-negative integer"
    )
    .toInt(),

  body("sku")
    .trim()
    .notEmpty()
    .withMessage("SKU is required")
    .isLength({ max: 50 })
    .withMessage(
      "SKU must be at most 50 characters"
    ),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage(
      "Category must be at most 50 characters"
    ),
];

export const validateProduct = (
  req,
  res,
  next
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};