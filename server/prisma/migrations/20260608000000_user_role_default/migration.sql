-- Add USER as the default public registration role without modifying existing admins.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';
