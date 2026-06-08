-- Separate ecommerce customers from dashboard/staff users.
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_status_idx" ON "customers"("status");
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- Backfill customer profiles from prior User-backed customers:
-- - USER role accounts from public registration
-- - any user record referenced by an existing order, to preserve order history
INSERT INTO "customers" ("id", "name", "email", "status", "createdAt", "updatedAt")
SELECT DISTINCT
    u."id",
    u."name",
    u."email",
    COALESCE(u."customerStatus", 'ACTIVE'),
    u."createdAt",
    u."updatedAt"
FROM "users" u
WHERE u."role" = 'USER'
   OR EXISTS (
      SELECT 1
      FROM "orders" o
      WHERE o."userId" = u."id"
   )
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "orders" ADD COLUMN "customerId" TEXT;

UPDATE "orders" o
SET "customerId" = c."id"
FROM "customers" c
WHERE c."id" = o."userId";

ALTER TABLE "orders" ALTER COLUMN "customerId" SET NOT NULL;

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_userId_fkey";
DROP INDEX IF EXISTS "orders_userId_idx";

CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "customers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders" DROP COLUMN "userId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "customerStatus";
