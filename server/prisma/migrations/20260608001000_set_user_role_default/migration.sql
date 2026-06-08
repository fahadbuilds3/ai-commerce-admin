-- Use USER as the default public registration role after the enum value exists.
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
