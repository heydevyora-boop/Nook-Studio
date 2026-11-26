-- Add STAFF and USER roles alongside the existing ADMIN role.
ALTER TYPE "Role" ADD VALUE 'STAFF';
ALTER TYPE "Role" ADD VALUE 'USER';

-- Existing rows predate the `username` field and are reseeded by
-- `prisma/seed.ts` with the three canonical demo accounts, so it's safe to
-- clear the table before adding the new required, unique column.
DELETE FROM "users";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
