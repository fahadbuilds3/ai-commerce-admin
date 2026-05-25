import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { ensureAdminUser } from "./seedAdmin.js";

const PORT = process.env.PORT || 5000;
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);

// Ensure the admin user exists after any DB reset/migration.
// Keeps auth flow unchanged; only seeds when missing.
await ensureAdminUser();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
