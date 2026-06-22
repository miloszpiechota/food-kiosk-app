-- AlterTable
ALTER TABLE "products" ADD COLUMN "regular_meal_id" UUID;

-- AlterTable
ALTER TABLE "product_group_options" DROP COLUMN "is_default";

-- AlterTable
ALTER TABLE "basket_items" ADD COLUMN "configuration_fingerprint" TEXT;

UPDATE "basket_items"
SET "configuration_fingerprint" = "id"::TEXT;

ALTER TABLE "basket_items"
ALTER COLUMN "configuration_fingerprint" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_regular_meal_id_key" ON "products"("regular_meal_id");

-- CreateIndex
CREATE UNIQUE INDEX "basket_items_basket_id_menu_product_id_configuration_fingerprint_key"
ON "basket_items"("basket_id", "menu_product_id", "configuration_fingerprint");

-- AddForeignKey
ALTER TABLE "products"
ADD CONSTRAINT "products_regular_meal_id_fkey"
FOREIGN KEY ("regular_meal_id") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
