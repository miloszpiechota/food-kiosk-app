-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('item', 'meal', 'large_meal');

-- CreateEnum
CREATE TYPE "selection_mode" AS ENUM ('single', 'multiple');

-- CreateEnum
CREATE TYPE "modifier_action_type" AS ENUM ('remove', 'add');

-- CreateEnum
CREATE TYPE "basket_status" AS ENUM ('active', 'checked_out', 'abandoned', 'expired');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('new', 'in_progress', 'ready', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'awaiting_payment_confirmation', 'paid', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('stripe');

-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('admin');

-- CreateEnum
CREATE TYPE "availability_override_type" AS ENUM ('closure', 'special_opening', 'manual_override');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "default_locale" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_translations" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "menu_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_translations" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "type" "product_type" NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_standalone_orderable" BOOLEAN NOT NULL DEFAULT false,
    "can_be_meal_option" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_translations" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_products" (
    "id" UUID NOT NULL,
    "menu_category_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "menu_price" DECIMAL(10,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_availability_rules" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "days_of_week" INTEGER[],
    "start_minute_of_day" INTEGER NOT NULL,
    "end_minute_of_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_availability_exceptions" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "override_type" "availability_override_type" NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_category_availability_rules" (
    "id" UUID NOT NULL,
    "menu_category_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "days_of_week" INTEGER[],
    "start_minute_of_day" INTEGER NOT NULL,
    "end_minute_of_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_category_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_category_availability_exceptions" (
    "id" UUID NOT NULL,
    "menu_category_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "override_type" "availability_override_type" NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_category_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_product_availability_rules" (
    "id" UUID NOT NULL,
    "menu_product_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "days_of_week" INTEGER[],
    "start_minute_of_day" INTEGER NOT NULL,
    "end_minute_of_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_product_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_product_availability_exceptions" (
    "id" UUID NOT NULL,
    "menu_product_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "override_type" "availability_override_type" NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_product_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_group_templates" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_min_selections" INTEGER NOT NULL DEFAULT 0,
    "default_max_selections" INTEGER NOT NULL DEFAULT 1,
    "default_selection_mode" "selection_mode" NOT NULL DEFAULT 'single',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_group_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_group_template_translations" (
    "id" UUID NOT NULL,
    "product_group_template_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "product_group_template_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_groups" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_group_template_id" UUID NOT NULL,
    "name_override" TEXT,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "selection_mode" "selection_mode" NOT NULL DEFAULT 'single',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_group_options" (
    "id" UUID NOT NULL,
    "product_group_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "price_adjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_group_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_translations" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ingredient_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "default_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_default_included" BOOLEAN NOT NULL DEFAULT false,
    "is_removable" BOOLEAN NOT NULL DEFAULT false,
    "remove_price_adjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "allow_extra" BOOLEAN NOT NULL DEFAULT false,
    "extra_unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_extra_quantity" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "action_type" "modifier_action_type" NOT NULL,
    "selection_type" "selection_mode" NOT NULL,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "allow_quantity" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "product_ingredient_id" UUID,
    "price_adjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_quantity" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baskets" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "basket_status" NOT NULL,
    "subtotal_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "baskets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket_items" (
    "id" UUID NOT NULL,
    "basket_id" UUID NOT NULL,
    "menu_product_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "configuration_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "basket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "order_status" NOT NULL,
    "payment_status" "payment_status" NOT NULL,
    "subtotal_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "menu_product_id" UUID,
    "product_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" "product_type" NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "configuration_snapshot" JSONB NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_session_id" TEXT NOT NULL,
    "provider_payment_intent_id" TEXT,
    "status" "payment_status" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "token_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "menus_restaurant_id_is_active_sort_order_idx" ON "menus"("restaurant_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "menus_restaurant_id_code_key" ON "menus"("restaurant_id", "code");

-- CreateIndex
CREATE INDEX "menu_translations_menu_id_idx" ON "menu_translations"("menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_translations_menu_id_locale_key" ON "menu_translations"("menu_id", "locale");

-- CreateIndex
CREATE INDEX "categories_restaurant_id_is_active_sort_order_idx" ON "categories"("restaurant_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_restaurant_id_code_key" ON "categories"("restaurant_id", "code");

-- CreateIndex
CREATE INDEX "category_translations_category_id_idx" ON "category_translations"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_translations_category_id_locale_key" ON "category_translations"("category_id", "locale");

-- CreateIndex
CREATE INDEX "products_restaurant_id_type_is_available_idx" ON "products"("restaurant_id", "type", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "products_restaurant_id_sku_key" ON "products"("restaurant_id", "sku");

-- CreateIndex
CREATE INDEX "product_translations_product_id_idx" ON "product_translations"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_product_id_locale_key" ON "product_translations"("product_id", "locale");

-- CreateIndex
CREATE INDEX "menu_categories_menu_id_is_visible_sort_order_idx" ON "menu_categories"("menu_id", "is_visible", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_menu_id_category_id_key" ON "menu_categories"("menu_id", "category_id");

-- CreateIndex
CREATE INDEX "menu_products_menu_category_id_is_visible_sort_order_idx" ON "menu_products"("menu_category_id", "is_visible", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_products_menu_category_id_product_id_key" ON "menu_products"("menu_category_id", "product_id");

-- CreateIndex
CREATE INDEX "menu_availability_rules_menu_id_is_active_idx" ON "menu_availability_rules"("menu_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_availability_exceptions_menu_id_is_active_idx" ON "menu_availability_exceptions"("menu_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_category_availability_rules_menu_category_id_is_active_idx" ON "menu_category_availability_rules"("menu_category_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_category_availability_exceptions_menu_category_id_is_a_idx" ON "menu_category_availability_exceptions"("menu_category_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_product_availability_rules_menu_product_id_is_active_idx" ON "menu_product_availability_rules"("menu_product_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_product_availability_exceptions_menu_product_id_is_act_idx" ON "menu_product_availability_exceptions"("menu_product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_group_templates_code_key" ON "product_group_templates"("code");

-- CreateIndex
CREATE INDEX "product_group_template_translations_product_group_template__idx" ON "product_group_template_translations"("product_group_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_group_template_translations_product_group_template__key" ON "product_group_template_translations"("product_group_template_id", "locale");

-- CreateIndex
CREATE INDEX "product_groups_product_id_sort_order_idx" ON "product_groups"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_group_options_product_group_id_is_available_sort_or_idx" ON "product_group_options"("product_group_id", "is_available", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_group_options_product_group_id_product_id_key" ON "product_group_options"("product_group_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_code_key" ON "ingredients"("code");

-- CreateIndex
CREATE INDEX "ingredient_translations_ingredient_id_idx" ON "ingredient_translations"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_translations_ingredient_id_locale_key" ON "ingredient_translations"("ingredient_id", "locale");

-- CreateIndex
CREATE INDEX "product_ingredients_product_id_is_available_sort_order_idx" ON "product_ingredients"("product_id", "is_available", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_product_id_ingredient_id_key" ON "product_ingredients"("product_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "modifier_groups_product_id_sort_order_idx" ON "modifier_groups"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "modifier_options_modifier_group_id_is_available_sort_order_idx" ON "modifier_options"("modifier_group_id", "is_available", "sort_order");

-- CreateIndex
CREATE INDEX "baskets_session_id_status_idx" ON "baskets"("session_id", "status");

-- CreateIndex
CREATE INDEX "basket_items_basket_id_idx" ON "basket_items"("basket_id");

-- CreateIndex
CREATE INDEX "basket_items_menu_product_id_idx" ON "basket_items"("menu_product_id");

-- CreateIndex
CREATE INDEX "basket_items_product_id_idx" ON "basket_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_status_payment_status_idx" ON "orders"("status", "payment_status");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_idx" ON "orders"("restaurant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_menu_product_id_idx" ON "order_items"("menu_product_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_session_id_key" ON "payments"("provider_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_id_key" ON "admin_sessions"("token_id");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_user_id_expires_at_revoked_at_idx" ON "admin_sessions"("admin_user_id", "expires_at", "revoked_at");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_translations" ADD CONSTRAINT "menu_translations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_products" ADD CONSTRAINT "menu_products_menu_category_id_fkey" FOREIGN KEY ("menu_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_products" ADD CONSTRAINT "menu_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_availability_rules" ADD CONSTRAINT "menu_availability_rules_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_availability_exceptions" ADD CONSTRAINT "menu_availability_exceptions_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_category_availability_rules" ADD CONSTRAINT "menu_category_availability_rules_menu_category_id_fkey" FOREIGN KEY ("menu_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_category_availability_exceptions" ADD CONSTRAINT "menu_category_availability_exceptions_menu_category_id_fkey" FOREIGN KEY ("menu_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_product_availability_rules" ADD CONSTRAINT "menu_product_availability_rules_menu_product_id_fkey" FOREIGN KEY ("menu_product_id") REFERENCES "menu_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_product_availability_exceptions" ADD CONSTRAINT "menu_product_availability_exceptions_menu_product_id_fkey" FOREIGN KEY ("menu_product_id") REFERENCES "menu_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_template_translations" ADD CONSTRAINT "product_group_template_translations_product_group_template_fkey" FOREIGN KEY ("product_group_template_id") REFERENCES "product_group_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_product_group_template_id_fkey" FOREIGN KEY ("product_group_template_id") REFERENCES "product_group_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_options" ADD CONSTRAINT "product_group_options_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "product_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_options" ADD CONSTRAINT "product_group_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_translations" ADD CONSTRAINT "ingredient_translations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_product_ingredient_id_fkey" FOREIGN KEY ("product_ingredient_id") REFERENCES "product_ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_basket_id_fkey" FOREIGN KEY ("basket_id") REFERENCES "baskets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_menu_product_id_fkey" FOREIGN KEY ("menu_product_id") REFERENCES "menu_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_product_id_fkey" FOREIGN KEY ("menu_product_id") REFERENCES "menu_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
