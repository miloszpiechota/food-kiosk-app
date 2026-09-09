ALTER TABLE "admin_users"
  ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMPTZ(6);

CREATE TABLE "admin_invite_restaurant_access" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_invite_id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_invite_restaurant_access_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_recovery_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_user_id" UUID NOT NULL,
  "code_hash" TEXT NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_recovery_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_admin_user_id" UUID,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_invite_restaurant_access_admin_invite_id_restaurant_id_key"
  ON "admin_invite_restaurant_access"("admin_invite_id", "restaurant_id");
CREATE INDEX "admin_invite_restaurant_access_admin_invite_id_idx"
  ON "admin_invite_restaurant_access"("admin_invite_id");
CREATE INDEX "admin_invite_restaurant_access_restaurant_id_idx"
  ON "admin_invite_restaurant_access"("restaurant_id");

CREATE UNIQUE INDEX "admin_recovery_codes_code_hash_key"
  ON "admin_recovery_codes"("code_hash");
CREATE INDEX "admin_recovery_codes_admin_user_id_consumed_at_idx"
  ON "admin_recovery_codes"("admin_user_id", "consumed_at");

CREATE INDEX "admin_audit_logs_actor_admin_user_id_created_at_idx"
  ON "admin_audit_logs"("actor_admin_user_id", "created_at");
CREATE INDEX "admin_audit_logs_action_created_at_idx"
  ON "admin_audit_logs"("action", "created_at");

ALTER TABLE "admin_invite_restaurant_access"
  ADD CONSTRAINT "admin_invite_restaurant_access_admin_invite_id_fkey"
  FOREIGN KEY ("admin_invite_id") REFERENCES "admin_invites"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_invite_restaurant_access"
  ADD CONSTRAINT "admin_invite_restaurant_access_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_recovery_codes"
  ADD CONSTRAINT "admin_recovery_codes_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actor_admin_user_id_fkey"
  FOREIGN KEY ("actor_admin_user_id") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
