-- Link the existing development seed's regular and large burger meals.
UPDATE "products" AS large_meal
SET "regular_meal_id" = regular_meal."id"
FROM "products" AS regular_meal
WHERE large_meal."restaurant_id" = regular_meal."restaurant_id"
  AND large_meal."sku" = 'meal-burger-large'
  AND regular_meal."sku" = 'meal-burger'
  AND large_meal."type" = 'large_meal'
  AND regular_meal."type" = 'meal'
  AND large_meal."regular_meal_id" IS NULL;

-- Large meals are selected through their linked regular meal, not listed as cards.
UPDATE "menu_products" AS menu_product
SET "is_visible" = FALSE,
    "updated_at" = CURRENT_TIMESTAMP
FROM "products" AS product
WHERE menu_product."product_id" = product."id"
  AND product."type" = 'large_meal';
