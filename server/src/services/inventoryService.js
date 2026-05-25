import prisma from "../config/prisma.js";

class InventoryService {
  /**
   * Get paginated inventory items with filtering and search
   */
  async getInventory(query = {}) {
    try {
      const page = Math.max(1, parseInt(query.page) || 1);
      const limit = Math.max(1, parseInt(query.limit) || 10);
      const skip = (page - 1) * limit;

      const { search, category, status, sortBy = "updatedAt", sortOrder = "desc" } = query;

      const where = { isDeleted: false };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (status) {
        if (status === "Out of Stock") where.stock = { lte: 0 };
        else if (status === "Low Stock") where.stock = { gt: 0, lte: 10 };
        else if (status === "In Stock") where.stock = { gt: 10 };
      }

      const validSortFields = ["name", "sku", "price", "stock", "updatedAt"];
      const orderBy = {
        [validSortFields.includes(sortBy) ? sortBy : "updatedAt"]: sortOrder === "asc" ? "asc" : "desc",
      };

      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
      ]);

      const items = (products || []).map((product) => {
        const stock = product?.stock || 0;
        const price = product?.price || 0;
        
        let inventoryStatus = "Out of Stock";
        if (stock > 10) inventoryStatus = "In Stock";
        else if (stock > 0) inventoryStatus = "Low Stock";

        return {
          id: product?.id,
          name: product?.name || "Unknown Product",
          sku: product?.sku || "N/A",
          category: product?.category || "Uncategorized",
          price,
          stock,
          status: product?.status || "DRAFT",
          imageUrl: product?.imageUrl || null, // Defensive handling for missing images
          inventoryStatus,
          inventoryValue: stock * price,
          reserved: 0,
          available: stock,
          incoming: 0,
          updatedAt: product?.updatedAt,
        };
      });

      return {
        items,
        total: total || 0,
        page,
        totalPages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      throw new Error(`Inventory fetch failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Get top-level inventory KPIs
   */
  async getInventoryStats() {
    try {
      // Use aggregate queries and count for safe KPI calculation
      const [totalProducts, outOfStock, lowStock, inStock, valueData] = await Promise.all([
        prisma.product.count({ where: { isDeleted: false } }),
        prisma.product.count({ where: { isDeleted: false, stock: { lte: 0 } } }),
        prisma.product.count({ where: { isDeleted: false, stock: { gt: 0, lte: 10 } } }),
        prisma.product.count({ where: { isDeleted: false, stock: { gt: 10 } } }),
        prisma.product.findMany({
          where: { isDeleted: false },
          select: { stock: true, price: true },
        }),
      ]);

      const inventoryValue = (valueData || []).reduce((acc, product) => {
        const stock = product?.stock || 0;
        const price = product?.price || 0;
        return acc + (stock * price);
      }, 0);

      return {
        totalProducts: totalProducts || 0,
        inStock: inStock || 0,
        lowStock: lowStock || 0,
        outOfStock: outOfStock || 0,
        inventoryValue: inventoryValue || 0,
      };
    } catch (error) {
      throw new Error(`Inventory stats failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Adjust stock for a single product
   */
  async adjustStock(id, newStock) {
    try {
      if (newStock === undefined || newStock === null || newStock < 0) {
        throw new Error("Invalid stock quantity");
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { 
          stock: newStock,
          status: newStock === 0 ? "OUT_OF_STOCK" : "ACTIVE"
        },
      });

      const stock = updatedProduct?.stock || 0;
      const price = updatedProduct?.price || 0;

      let inventoryStatus = "Out of Stock";
      if (stock > 10) inventoryStatus = "In Stock";
      else if (stock > 0) inventoryStatus = "Low Stock";

      return {
        ...updatedProduct,
        inventoryStatus,
        inventoryValue: stock * price,
      };
    } catch (error) {
      throw new Error(`Stock adjustment failed: ${error?.message || "Unknown error"}`);
    }
  }
  /**
   * Update inventory item (product)
   */
  async updateInventory(id, data) {
    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          stock: data.stock !== undefined ? data.stock : undefined,
          sku: data.sku,
          category: data.category,
          price: data.price,
          status: data.stock === 0 ? "OUT_OF_STOCK" : data.stock !== undefined ? "ACTIVE" : undefined
        },
      });

      const stock = updatedProduct?.stock || 0;
      const price = updatedProduct?.price || 0;

      let inventoryStatus = "Out of Stock";
      if (stock > 10) inventoryStatus = "In Stock";
      else if (stock > 0) inventoryStatus = "Low Stock";

      return {
        ...updatedProduct,
        inventoryStatus,
        inventoryValue: stock * price,
      };
    } catch (error) {
      throw new Error(`Inventory update failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Delete (soft delete) an inventory item
   */
  async deleteInventory(id) {
    try {
      return await prisma.product.update({
        where: { id },
        data: { isDeleted: true },
      });
    } catch (error) {
      throw new Error(`Inventory deletion failed: ${error?.message || "Unknown error"}`);
    }
  }
}

export const inventoryService = new InventoryService();
