-- AddEnumValue
ALTER TYPE "admin_role" ADD VALUE IF NOT EXISTS 'super_admin';

-- CreateEnum
CREATE TYPE "admin_login_challenge_type" AS ENUM ('totp');

-- AlterTable
ALTER TABLE "admin_users"
  ADD COLUMN "two_factor_secret" TEXT,
  ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "admin_sessions"
  ADD COLUMN "token_hash" TEXT;

UPDATE "admin_sessions"
SET "token_hash" = "token_id"::TEXT
WHERE "token_hash" IS NULL;

ALTER TABLE "admin_sessions"
  ALTER COLUMN "token_hash" SET NOT NULL;

-- CreateTable
CREATE TABLE "admin_restaurant_access" (
  "id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_restaurant_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invites" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "admin_role" NOT NULL,
  "restaurant_id" UUID,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "accepted_at" TIMESTAMPTZ(6),
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_login_challenges" (
  "id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "challenge_type" "admin_login_challenge_type" NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_login_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_password_reset_tokens" (
  "id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "admin_restaurant_access_admin_user_id_restaurant_id_key"
  ON "admin_restaurant_access"("admin_user_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "admin_restaurant_access_admin_user_id_idx" ON "admin_restaurant_access"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_restaurant_access_restaurant_id_idx" ON "admin_restaurant_access"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_token_hash_key" ON "admin_invites"("token_hash");

-- CreateIndex
CREATE INDEX "admin_invites_email_expires_at_accepted_at_idx"
  ON "admin_invites"("email", "expires_at", "accepted_at");

-- CreateIndex
CREATE INDEX "admin_invites_created_by_id_idx" ON "admin_invites"("created_by_id");

-- CreateIndex
CREATE INDEX "admin_invites_restaurant_id_idx" ON "admin_invites"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_login_challenges_token_hash_key" ON "admin_login_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "admin_login_challenges_admin_user_id_expires_at_consumed_at_idx"
  ON "admin_login_challenges"("admin_user_id", "expires_at", "consumed_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_password_reset_tokens_token_hash_key" ON "admin_password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "admin_password_reset_tokens_admin_user_id_expires_at_consumed_at_idx"
  ON "admin_password_reset_tokens"("admin_user_id", "expires_at", "consumed_at");

-- AddForeignKey
ALTER TABLE "admin_restaurant_access"
  ADD CONSTRAINT "admin_restaurant_access_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_restaurant_access"
  ADD CONSTRAINT "admin_restaurant_access_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites"
  ADD CONSTRAINT "admin_invites_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites"
  ADD CONSTRAINT "admin_invites_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_login_challenges"
  ADD CONSTRAINT "admin_login_challenges_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_password_reset_tokens"
  ADD CONSTRAINT "admin_password_reset_tokens_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
