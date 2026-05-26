// Reusable AI prompt templates for the AI Assistant UI.
// Frontend-only: does not change backend AI architecture.

export const aiPromptTemplates = [
  {
    category: "Inventory",
    templates: [
      {
        id: "inventory-risks",
        title: "Analyze inventory risks",
        prompt:
          "Analyze inventory risks for the next 30 days. Identify likely stockouts/overstock, explain drivers (lead times, sales velocity, seasonality), and propose mitigation steps with prioritized actions."
      },
      {
        id: "inventory-restock",
        title: "Suggest restock priorities",
        prompt:
          "Suggest restock priorities for low-stock items. For each product: include current stock, estimated days of supply, expected demand drivers, and a recommended reorder quantity or replenishment strategy."
      }
    ]
  },
  {
    category: "Analytics",
    templates: [
      {
        id: "analytics-sales-summary",
        title: "Summarize sales performance",
        prompt:
          "Summarize sales performance for the last 30 days. Highlight top products, revenue trends, conversion indicators, and actionable insights to improve revenue and margins. Include a short 'what changed' section and 3-5 next steps."
      }
    ]
  },
  {
    category: "Customers",
    templates: [
      {
        id: "customers-apology-email",
        title: "Draft customer apology email",
        prompt:
          "Draft a concise, empathetic customer apology email for a recent order issue. Include: acknowledgement of the problem, reassurance, what we are doing to fix it, and a clear call-to-action. Use a friendly ecommerce tone."
      }
    ]
  },
  {
    category: "Marketing",
    templates: [
      {
        id: "marketing-product-description",
        title: "Generate product description",
        prompt:
          "Generate a high-converting product description for the following product: [PASTE PRODUCT]. Provide: a short headline, 3-5 bullet benefits, a brief story/brand angle, and an SEO-friendly summary. Keep it clear and scannable."
      }
    ]
  },
  {
    category: "Orders",
    templates: [
      {
        id: "orders-followup",
        title: "Create an order follow-up message",
        prompt:
          "Create a friendly order follow-up message to send after delivery. Ask about satisfaction, include support contact, and suggest a next purchase or review. Keep it short and helpful."
      }
    ]
  }
];

