-- CreateEnum
CREATE TYPE "product_label" AS ENUM ('popular', 'new', 'vegetarian');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "label" "product_label";
