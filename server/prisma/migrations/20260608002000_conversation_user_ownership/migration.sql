-- Add per-user ownership for persisted AI conversations.
ALTER TABLE "conversations" ADD COLUMN "userId" TEXT;

-- Existing pre-auth conversations had no owner. Assign them to the first admin
-- account when possible, otherwise the first user account, before enforcing
-- required ownership going forward.
UPDATE "conversations"
SET "userId" = COALESCE(
  (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
  (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

ALTER TABLE "conversations" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX "conversations_userId_updatedAt_idx" ON "conversations"("userId", "updatedAt");

ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
