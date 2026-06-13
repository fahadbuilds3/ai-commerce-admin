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
    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors min-w-[48px] min-h-[48px]">
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
      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition group-hover:scale-105 group-hover:shadow-lg duration-150 ease-out"
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
            "border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300" +
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
      className="group border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
      tabIndex={0}
    >
      {/* Image */}
      <td className="min-w-[64px] px-3 py-3 align-middle">
        <ProductImage src={product.imageUrl} alt={product.name} />
      </td>
      {/* Name + SKU */}
      <td className="min-w-[220px] max-w-[280px] px-3 py-3 align-middle">
        <span className="block truncate text-sm font-medium leading-tight text-slate-800 dark:text-slate-200" title={product.name}>
          {product.name}
        </span>
        {product.sku && (
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{product.sku}</span>
        )}
      </td>
      {/* Category */}
      <td className="hidden min-w-[130px] max-w-[160px] px-3 py-3 align-middle md:table-cell">
        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs max-w-[8rem] truncate">
          {product.category || "Uncategorized"}
        </span>
      </td>
      {/* Price */}
      <td className="min-w-[100px] whitespace-nowrap px-3 py-3 text-right align-middle text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        ${Number(product.price).toFixed(2)}
      </td>
      {/* Stock */}
      <td className="hidden min-w-[80px] whitespace-nowrap px-3 py-3 text-right align-middle md:table-cell">
        <span className="block font-medium">{product.stock}</span>
      </td>
      {/* Status */}
      <td className="hidden min-w-[120px] whitespace-nowrap px-3 py-3 align-middle md:table-cell">
        <InventoryBadge stock={product.stock} />
      </td>
      {/* Actions */}
      <td className="min-w-[110px] whitespace-nowrap px-3 py-3 align-middle">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="icon-button rounded-md"
            aria-label="Edit product"
            onClick={() => handleEditProduct(product)}
            tabIndex={0}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="icon-button icon-button-danger rounded-md"
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
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {/* Add Product button (responsive alignment) */}
      {typeof onAdd === "function" && (
        <div className="flex justify-end items-center px-3 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="btn btn-primary rounded-md px-3 sm:text-base"
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
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[860px] table-fixed text-sm">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex justify-center items-center py-12 sm:py-16">
                    <Loader2 className="animate-spin w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400" />
                    <span className="ml-3 text-slate-600 dark:text-slate-400 font-medium text-base">
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
                  <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-slate-500 dark:text-slate-400 px-4">
                    <ImageOff className="w-10 h-10 sm:w-12 sm:h-12 mb-3" />
                    <div className="text-base sm:text-lg font-semibold">{emptyMessage}</div>
                    <div className="text-xs sm:text-sm mt-1 mb-2 text-slate-600 dark:text-slate-400">
                      Add products to see them here.
                    </div>
                    {typeof onAdd === "function" && (
                      <button
                        type="button"
                        className="btn btn-primary mt-6 rounded-md px-3 sm:text-base"
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
