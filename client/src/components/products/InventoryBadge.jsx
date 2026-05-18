import React from "react";
import PropTypes from "prop-types";

// InventoryBadge: Shows a stock badge with color/status.
// Usage: <InventoryBadge stock={product.stock} />
const InventoryBadge = ({ stock }) => {
  let label = "";
  let badgeClasses =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150";

  if (stock === 0) {
    label = "Out of Stock";
    badgeClasses +=
      " bg-red-100 text-red-700 border border-red-200 shadow-sm";
  } else if (stock <= 5) {
    label = "Low Stock";
    badgeClasses +=
      " bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm animate-pulse";
  } else {
    label = "In Stock";
    badgeClasses +=
      " bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm";
  }

  return (
    <span className={badgeClasses}>
      <svg
        className="w-3 h-3 mr-1.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        {stock === 0 ? (
          // X icon (Out of Stock)
          <path
            fillRule="evenodd"
            d="M10 8.586l4.95-4.95a1 1 0 111.415 1.415L11.414 10l4.95 4.95a1 1 0 01-1.415 1.415L10 11.414l-4.95 4.95a1 1 0 01-1.415-1.415L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
            clipRule="evenodd"
          />
        ) : stock <= 5 ? (
          // Exclamation icon (Low Stock)
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 01.894.553l7 14A1 1 0 0117 18H3a1 1 0 01-.894-1.447l7-14A1 1 0 0110 2zm0 4.618L4.618 16h10.764L10 6.618zM9 11a1 1 0 102 0v2a1 1 0 10-2 0v-2zm1 4a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        ) : (
          // Check icon (In Stock)
          <path
            fillRule="evenodd"
            d="M16.707 7.293a1 1 0 00-1.414-1.414l-6.01 6.01-2.586-2.585A1 1 0 104.293 11.707l3.293 3.293a1 1 0 001.414 0l7-7z"
            clipRule="evenodd"
          />
        )}
      </svg>
      {label}
    </span>
  );
};

InventoryBadge.propTypes = {
  stock: PropTypes.number.isRequired,
};

export default InventoryBadge;