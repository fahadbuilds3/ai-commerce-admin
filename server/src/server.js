import "./config/env.js";
import app from "./app.js";
import { ensureAdminUser } from "./seedAdmin.js";

const PORT = process.env.PORT || 5000;

// Ensure the admin user exists after any DB reset/migration.
// Keeps auth flow unchanged; only seeds when missing.
await ensureAdminUser();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
