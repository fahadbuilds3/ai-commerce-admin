import React from "react";
import PropTypes from "prop-types";
import InventoryBadge from "./InventoryBadge";
import { Pencil, Trash2, Loader2, ImageOff, Plus } from "lucide-react";

// Helper: Accessible Image with fallback for invalid or missing images
const ProductImage = React.memo(function ProductImage({ src, alt }) {
  const isValid =
    typeof src === "string" &&
    /^https?:\/\/.*\.(jpeg|jpg|png|webp|gif|svg)(\?|#|$)/i.test(src.trim());

  const placeholder = (
    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-zinc-800 bg-zinc-800 text-zinc-600 transition-colors min-w-[48px] min-h-[48px]">
      <ImageOff className="w-5 h-5" aria-label="No image" />
    </div>
  );

  if (
    !src ||
    typeof src !== "string" ||
    !/^https?:\/\/.+\.(jpeg|jpg|png|webp|gif|svg)?/i.test(src.trim())
  ) {
    return placeholder;
  }
  return (
    <img
      src={src}
      alt={alt || "Product image"}
      loading="lazy"
      decoding="async"
      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border border-zinc-800 bg-zinc-900 transition group-hover:scale-105 group-hover:shadow-lg duration-150 ease-out"
      style={{ minWidth: 48, minHeight: 48 }}
      onError={e => {
        e.target.onerror = null;
        e.target.src = "";
        e.target.style.display = "none";
      }}
    />
  );
});
ProductImage.displayName = "ProductImage";

/**
 * ProductTable - React Query friendly, ecommerce production-ready rendering
 */
const columns = [
  { key: "image", label: "" },
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const mobileColumnKeys = ["image", "name", "price", "actions"];

const ProductTable = ({
  products,
  loading,
  onEdit,
  onDelete,
  onAdd,
  emptyMessage = "No products found.",
}) => {
  // Debug log for backend/react-query troubleshooting
  console.log("ProductTable received:", products);

  // Ensure products is always an array for mapping
  const safeProducts = Array.isArray(products) ? products : [];

  // Handlers
  const handleAddProduct = () => {
    if (typeof onAdd === "function") onAdd();
  };
  const handleEditProduct = (product) => {
    if (typeof onEdit === "function") onEdit(product);
  };
  const handleDeleteProduct = (product) => {
    if (typeof onDelete === "function") onDelete(product.id);
  };

  // Render header
  const renderTableHeader = () => (
    <tr>
      {columns.map((col) => (
        <th
          key={col.key}
          className={
            "px-2 py-3 text-left text-xs sm:text-sm font-semibold tracking-wider text-zinc-400 uppercase bg-zinc-900 whitespace-nowrap" +
            (mobileColumnKeys.includes(col.key) ? "" : " hidden md:table-cell")
          }
          scope="col"
        >
          {col.label}
        </th>
      ))}
    </tr>
  );

  // Render product row
  const renderProductRow = (product) => (
    <tr
      key={product.id}
      className="transition-colors hover:bg-zinc-800/70 group"
      tabIndex={0}
    >
      {/* Image */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 align-middle min-w-[56px]">
        <ProductImage src={product.imageUrl} alt={product.name} />
      </td>
      {/* Name + SKU */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 min-w-[115px] max-w-[15ch]">
        <span className="font-medium text-zinc-100 leading-tight block break-words text-sm sm:text-base">
          {product.name}
        </span>
        {product.sku && (
          <span className="text-xs text-zinc-500 truncate block">{product.sku}</span>
        )}
      </td>
      {/* Category */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 min-w-[80px] max-w-[10ch] hidden md:table-cell">
        <span className="inline-block bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs max-w-[8rem] truncate">
          {product.category || "Uncategorized"}
        </span>
      </td>
      {/* Price */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 font-mono min-w-[68px] max-w-[10ch] text-sm">
        ${Number(product.price).toFixed(2)}
      </td>
      {/* Stock */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 min-w-[40px] max-w-[8ch] hidden md:table-cell">
        <span className="block font-medium">{product.stock}</span>
      </td>
      {/* Status */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 min-w-[54px] hidden md:table-cell">
        <InventoryBadge stock={product.stock} />
      </td>
      {/* Actions */}
      <td className="px-2 py-2 sm:px-3 sm:py-3 min-w-[64px]">
        <div className="flex flex-col xs:flex-row gap-2 items-start xs:items-center">
          <button
            type="button"
            className="p-2 rounded-md bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white focus:outline-none transition-colors focus:ring-2 focus:ring-blue-600"
            aria-label="Edit product"
            onClick={() => handleEditProduct(product)}
            tabIndex={0}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-md bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white focus:outline-none transition-colors focus:ring-2 focus:ring-red-600"
            aria-label="Delete product"
            onClick={() => handleDeleteProduct(product)}
            tabIndex={0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="w-full bg-zinc-900 text-zinc-100 rounded-xl shadow-lg overflow-x-auto border border-zinc-800">
      {/* Add Product button (responsive alignment) */}
      {typeof onAdd === "function" && (
        <div className="flex justify-end items-center px-3 py-3 sm:py-4 border-b border-zinc-800">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors text-sm sm:text-base"
            onClick={handleAddProduct}
            aria-label="Add Product"
            tabIndex={0}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden xs:inline">Add Product</span>
            <span className="inline xs:hidden">Add</span>
          </button>
        </div>
      )}
      {/* Responsive Table/Scroll Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <table className="min-w-[540px] w-full divide-y divide-zinc-800 text-sm sm:text-base">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex justify-center items-center py-12 sm:py-16">
                    <Loader2 className="animate-spin w-7 h-7 sm:w-8 sm:h-8 text-zinc-400" />
                    <span className="ml-3 text-zinc-400 font-medium text-base">
                      Loading products...
                    </span>
                  </div>
                </td>
              </tr>
            ) : safeProducts.length > 0 ? (
              safeProducts.map((product) => renderProductRow(product))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-zinc-500 px-4">
                    <ImageOff className="w-10 h-10 sm:w-12 sm:h-12 mb-3" />
                    <div className="text-base sm:text-lg font-semibold">{emptyMessage}</div>
                    <div className="text-xs sm:text-sm mt-1 mb-2 text-zinc-400">
                      Add products to see them here.
                    </div>
                    {typeof onAdd === "function" && (
                      <button
                        type="button"
                        className="mt-6 flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors text-sm sm:text-base"
                        onClick={handleAddProduct}
                        aria-label="Add Product (empty)"
                        tabIndex={0}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="hidden xs:inline">Add Product</span>
                        <span className="inline xs:hidden">Add</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ProductTable.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      imageUrl: PropTypes.string,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string,
      category: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      stock: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAdd: PropTypes.func,
  emptyMessage: PropTypes.string,
};

ProductTable.defaultProps = {
  products: [],
  loading: false,
  onEdit: undefined,
  onDelete: undefined,
  onAdd: undefined,
  emptyMessage: "No products found.",
};

export default ProductTable;