-- Drop foreign keys so we can rename tables/columns safely
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";
ALTER TABLE "Architecture" DROP CONSTRAINT "Architecture_userId_fkey";

-- Rename tables to snake_case (plural)
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "RefreshToken" RENAME TO "refresh_tokens";
ALTER TABLE "Architecture" RENAME TO "architectures";

-- Rename columns on users
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns on refresh_tokens
ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns on architectures
ALTER TABLE "architectures" RENAME COLUMN "isPublic" TO "is_public";
ALTER TABLE "architectures" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "architectures" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "architectures" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename indexes to match new table/column names
ALTER INDEX "User_pkey" RENAME TO "users_pkey";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
ALTER INDEX "RefreshToken_pkey" RENAME TO "refresh_tokens_pkey";
ALTER INDEX "RefreshToken_token_key" RENAME TO "refresh_tokens_token_key";
ALTER INDEX "Architecture_pkey" RENAME TO "architectures_pkey";

-- Recreate foreign keys with new names
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "architectures"
  ADD CONSTRAINT "architectures_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
