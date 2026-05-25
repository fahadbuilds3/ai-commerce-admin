import { inventoryService } from "../services/inventoryService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * @desc    Get all inventory items (paginated, filterable)
 * @route   GET /api/inventory
 * @access  Private/Admin
 */
export const getInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventory(req.query);
  res.status(200).json({
    success: true,
    data: result.items,
    pagination: {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    },
  });
});

/**
 * @desc    Get inventory stats / KPIs
 * @route   GET /api/inventory/stats
 * @access  Private/Admin
 */
export const getInventoryStats = asyncHandler(async (req, res) => {
  const stats = await inventoryService.getInventoryStats();
  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Adjust stock for a specific product
 * @route   PATCH /api/inventory/:id/stock
 * @access  Private/Admin
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || typeof stock !== "number") {
    throw new ApiError(400, "Please provide a valid stock quantity");
  }

  const updatedItem = await inventoryService.adjustStock(id, stock);
  
  res.status(200).json({
    success: true,
    data: updatedItem,
  });
});

/**
 * @desc    Update an inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private/Admin
 */
export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedItem = await inventoryService.updateInventory(id, req.body);
  
  res.status(200).json({
    success: true,
    data: updatedItem,
  });
});

/**
 * @desc    Delete an inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private/Admin
 */
export const deleteInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await inventoryService.deleteInventory(id);
  
  res.status(200).json({
    success: true,
    message: "Inventory item deleted successfully"
  });
});
