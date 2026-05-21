import {
  ModifierActionType,
  Prisma,
  PrismaClient,
  ProductType,
  SelectionMode,
} from "@prisma/client";

const prisma = new PrismaClient();

const decimal = (value) => new Prisma.Decimal(value);

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "admin_sessions",
      "admin_users",
      "payments",
      "order_items",
      "orders",
      "basket_items",
      "baskets",
      "modifier_options",
      "modifier_groups",
      "product_ingredients",
      "ingredient_translations",
      "ingredients",
      "product_group_options",
      "product_groups",
      "product_group_template_translations",
      "product_group_templates",
      "menu_product_availability_exceptions",
      "menu_product_availability_rules",
      "menu_category_availability_exceptions",
      "menu_category_availability_rules",
      "menu_availability_exceptions",
      "menu_availability_rules",
      "menu_products",
      "menu_categories",
      "product_translations",
      "products",
      "category_translations",
      "categories",
      "menu_translations",
      "menus",
      "restaurants"
    CASCADE;
  `);
}

async function main() {
  await resetDatabase();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Food Kiosk Demo Restaurant",
      slug: "food-kiosk-demo",
      timezone: "Europe/Warsaw",
      defaultLocale: "en",
      currencyCode: "PLN",
      isActive: true,
    },
  });

  const mainMenu = await prisma.menu.create({
    data: {
      restaurantId: restaurant.id,
      code: "main-menu",
      name: "Main Menu",
      description: "Default kiosk menu used for local development and demos.",
      sortOrder: 1,
      isActive: true,
      translations: {
        create: [
          {
            locale: "en",
            name: "Main Menu",
            description: "Default kiosk menu used for local development and demos.",
          },
          {
            locale: "pl",
            name: "Menu Glowne",
            description: "Domyslne menu kiosku uzywane lokalnie i do demonstracji.",
          },
        ],
      },
    },
  });

  const categories = {
    meals: await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        code: "meals",
        name: "Meals",
        description: "Meal bundles and large meal bundles.",
        sortOrder: 1,
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Meals", description: "Meal bundles and large meal bundles." },
            { locale: "pl", name: "Zestawy", description: "Zestawy i powiekszone zestawy." },
          ],
        },
      },
    }),
    burgers: await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        code: "burgers",
        name: "Burgers",
        description: "Fresh burgers that can be ordered standalone or inside meals.",
        sortOrder: 2,
        isActive: true,
        translations: {
          create: [
            {
              locale: "en",
              name: "Burgers",
              description: "Fresh burgers that can be ordered standalone or inside meals.",
            },
            {
              locale: "pl",
              name: "Burgery",
              description: "Swieze burgery zamawiane osobno lub w zestawie.",
            },
          ],
        },
      },
    }),
    sides: await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        code: "sides",
        name: "Sides",
        description: "Side items available on their own or as meal choices.",
        sortOrder: 3,
        isActive: true,
        translations: {
          create: [
            {
              locale: "en",
              name: "Sides",
              description: "Side items available on their own or as meal choices.",
            },
            {
              locale: "pl",
              name: "Dodatki",
              description: "Dodatki dostepne osobno lub jako wybor w zestawie.",
            },
          ],
        },
      },
    }),
    drinks: await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        code: "drinks",
        name: "Drinks",
        description: "Cold drinks for kiosk ordering.",
        sortOrder: 4,
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Drinks", description: "Cold drinks for kiosk ordering." },
            { locale: "pl", name: "Napoje", description: "Zimne napoje dostepne w kiosku." },
          ],
        },
      },
    }),
  };

  const menuCategories = {
    meals: await prisma.menuCategory.create({
      data: {
        menuId: mainMenu.id,
        categoryId: categories.meals.id,
        sortOrder: 1,
        isVisible: true,
      },
    }),
    burgers: await prisma.menuCategory.create({
      data: {
        menuId: mainMenu.id,
        categoryId: categories.burgers.id,
        sortOrder: 2,
        isVisible: true,
      },
    }),
    sides: await prisma.menuCategory.create({
      data: {
        menuId: mainMenu.id,
        categoryId: categories.sides.id,
        sortOrder: 3,
        isVisible: true,
      },
    }),
    drinks: await prisma.menuCategory.create({
      data: {
        menuId: mainMenu.id,
        categoryId: categories.drinks.id,
        sortOrder: 4,
        isVisible: true,
      },
    }),
  };

  const ingredients = {
    bun: await prisma.ingredient.create({
      data: {
        code: "bun",
        name: "Brioche Bun",
        description: "Soft brioche burger bun.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Brioche Bun", description: "Soft brioche burger bun." },
            { locale: "pl", name: "Bulka brioche", description: "Miekka bulka do burgera." },
          ],
        },
      },
    }),
    beefPatty: await prisma.ingredient.create({
      data: {
        code: "beef-patty",
        name: "Beef Patty",
        description: "Grilled beef patty.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Beef Patty", description: "Grilled beef patty." },
            { locale: "pl", name: "Kotlet wolowy", description: "Grillowany kotlet wolowy." },
          ],
        },
      },
    }),
    cheddar: await prisma.ingredient.create({
      data: {
        code: "cheddar",
        name: "Cheddar",
        description: "Mild cheddar cheese slice.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Cheddar", description: "Mild cheddar cheese slice." },
            { locale: "pl", name: "Cheddar", description: "Lagodny plaster sera cheddar." },
          ],
        },
      },
    }),
    bacon: await prisma.ingredient.create({
      data: {
        code: "bacon",
        name: "Crispy Bacon",
        description: "Extra crispy bacon.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Crispy Bacon", description: "Extra crispy bacon." },
            { locale: "pl", name: "Chrupiacy bekon", description: "Dodatkowy chrupiacy bekon." },
          ],
        },
      },
    }),
    lettuce: await prisma.ingredient.create({
      data: {
        code: "lettuce",
        name: "Lettuce",
        description: "Fresh iceberg lettuce.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Lettuce", description: "Fresh iceberg lettuce." },
            { locale: "pl", name: "Salata", description: "Swieza salata lodowa." },
          ],
        },
      },
    }),
    tomato: await prisma.ingredient.create({
      data: {
        code: "tomato",
        name: "Tomato",
        description: "Sliced tomato.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Tomato", description: "Sliced tomato." },
            { locale: "pl", name: "Pomidor", description: "Plastry pomidora." },
          ],
        },
      },
    }),
    pickles: await prisma.ingredient.create({
      data: {
        code: "pickles",
        name: "Pickles",
        description: "Crunchy pickled cucumbers.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Pickles", description: "Crunchy pickled cucumbers." },
            { locale: "pl", name: "Ogorki konserwowe", description: "Chrupkie ogorki konserwowe." },
          ],
        },
      },
    }),
    ketchup: await prisma.ingredient.create({
      data: {
        code: "ketchup",
        name: "Ketchup",
        description: "Classic tomato ketchup.",
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Ketchup", description: "Classic tomato ketchup." },
            { locale: "pl", name: "Ketchup", description: "Klasyczny ketchup pomidorowy." },
          ],
        },
      },
    }),
  };

  const products = {
    classicBurger: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "burger-classic",
        name: "Classic Burger",
        description: "Single beef burger with salad and sauce.",
        basePrice: decimal("18.90"),
        imageUrl: "/seed/classic-burger.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 1,
        translations: {
          create: [
            {
              locale: "en",
              name: "Classic Burger",
              description: "Single beef burger with salad and sauce.",
            },
            {
              locale: "pl",
              name: "Burger klasyczny",
              description: "Pojedynczy burger wolowy z salata i sosem.",
            },
          ],
        },
      },
    }),
    cheeseBurger: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "burger-cheese",
        name: "Cheese Burger",
        description: "Beef burger with cheddar cheese and pickles.",
        basePrice: decimal("20.90"),
        imageUrl: "/seed/cheese-burger.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 2,
        translations: {
          create: [
            {
              locale: "en",
              name: "Cheese Burger",
              description: "Beef burger with cheddar cheese and pickles.",
            },
            {
              locale: "pl",
              name: "Cheeseburger",
              description: "Burger wolowy z serem cheddar i ogorkami.",
            },
          ],
        },
      },
    }),
    fries: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "fries-regular",
        name: "Regular Fries",
        description: "Lightly salted fries.",
        basePrice: decimal("8.90"),
        imageUrl: "/seed/fries.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 1,
        translations: {
          create: [
            { locale: "en", name: "Regular Fries", description: "Lightly salted fries." },
            { locale: "pl", name: "Frytki", description: "Lekko solone frytki." },
          ],
        },
      },
    }),
    sideSalad: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "side-salad",
        name: "Side Salad",
        description: "Small fresh salad.",
        basePrice: decimal("9.90"),
        imageUrl: "/seed/side-salad.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 2,
        translations: {
          create: [
            { locale: "en", name: "Side Salad", description: "Small fresh salad." },
            { locale: "pl", name: "Mala salatka", description: "Mala swieza salatka." },
          ],
        },
      },
    }),
    cola: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "drink-cola",
        name: "Cola",
        description: "Chilled cola drink.",
        basePrice: decimal("6.90"),
        imageUrl: "/seed/cola.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 1,
        translations: {
          create: [
            { locale: "en", name: "Cola", description: "Chilled cola drink." },
            { locale: "pl", name: "Cola", description: "Schlodzona cola." },
          ],
        },
      },
    }),
    orangeJuice: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.ITEM,
        sku: "drink-orange-juice",
        name: "Orange Juice",
        description: "Fresh orange juice.",
        basePrice: decimal("7.90"),
        imageUrl: "/seed/orange-juice.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: true,
        sortOrder: 2,
        translations: {
          create: [
            { locale: "en", name: "Orange Juice", description: "Fresh orange juice." },
            { locale: "pl", name: "Sok pomaranczowy", description: "Swiezy sok pomaranczowy." },
          ],
        },
      },
    }),
    burgerMeal: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.MEAL,
        sku: "meal-burger",
        name: "Burger Meal",
        description: "Choose one burger, one side, and one drink.",
        basePrice: decimal("27.90"),
        imageUrl: "/seed/burger-meal.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: false,
        sortOrder: 1,
        translations: {
          create: [
            {
              locale: "en",
              name: "Burger Meal",
              description: "Choose one burger, one side, and one drink.",
            },
            {
              locale: "pl",
              name: "Zestaw burger",
              description: "Wybierz jednego burgera, dodatek i napoj.",
            },
          ],
        },
      },
    }),
    largeBurgerMeal: await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        type: ProductType.LARGE_MEAL,
        sku: "meal-burger-large",
        name: "Large Burger Meal",
        description: "Large meal bundle with premium option pricing.",
        basePrice: decimal("31.90"),
        imageUrl: "/seed/large-burger-meal.jpg",
        isAvailable: true,
        isStandaloneOrderable: true,
        canBeMealOption: false,
        sortOrder: 2,
        translations: {
          create: [
            {
              locale: "en",
              name: "Large Burger Meal",
              description: "Large meal bundle with premium option pricing.",
            },
            {
              locale: "pl",
              name: "Duzy zestaw burger",
              description: "Powiekszony zestaw z doplatami za wybrane opcje premium.",
            },
          ],
        },
      },
    }),
  };

  const menuProducts = {
    burgerMeal: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.meals.id,
        productId: products.burgerMeal.id,
        menuPrice: decimal("27.90"),
        sortOrder: 1,
        isVisible: true,
      },
    }),
    largeBurgerMeal: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.meals.id,
        productId: products.largeBurgerMeal.id,
        menuPrice: decimal("31.90"),
        sortOrder: 2,
        isVisible: true,
      },
    }),
    classicBurger: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.burgers.id,
        productId: products.classicBurger.id,
        menuPrice: decimal("18.90"),
        sortOrder: 1,
        isVisible: true,
      },
    }),
    cheeseBurger: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.burgers.id,
        productId: products.cheeseBurger.id,
        menuPrice: decimal("20.90"),
        sortOrder: 2,
        isVisible: true,
      },
    }),
    fries: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.sides.id,
        productId: products.fries.id,
        menuPrice: decimal("8.90"),
        sortOrder: 1,
        isVisible: true,
      },
    }),
    sideSalad: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.sides.id,
        productId: products.sideSalad.id,
        menuPrice: decimal("9.90"),
        sortOrder: 2,
        isVisible: true,
      },
    }),
    cola: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.drinks.id,
        productId: products.cola.id,
        menuPrice: decimal("6.90"),
        sortOrder: 1,
        isVisible: true,
      },
    }),
    orangeJuice: await prisma.menuProduct.create({
      data: {
        menuCategoryId: menuCategories.drinks.id,
        productId: products.orangeJuice.id,
        menuPrice: decimal("7.90"),
        sortOrder: 2,
        isVisible: true,
      },
    }),
  };

  const groupTemplates = {
    sandwich: await prisma.productGroupTemplate.create({
      data: {
        code: "meal-sandwich",
        name: "Choose your burger",
        defaultMinSelections: 1,
        defaultMaxSelections: 1,
        defaultSelectionMode: SelectionMode.SINGLE,
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Choose your burger" },
            { locale: "pl", name: "Wybierz burgera" },
          ],
        },
      },
    }),
    side: await prisma.productGroupTemplate.create({
      data: {
        code: "meal-side",
        name: "Choose your side",
        defaultMinSelections: 1,
        defaultMaxSelections: 1,
        defaultSelectionMode: SelectionMode.SINGLE,
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Choose your side" },
            { locale: "pl", name: "Wybierz dodatek" },
          ],
        },
      },
    }),
    drink: await prisma.productGroupTemplate.create({
      data: {
        code: "meal-drink",
        name: "Choose your drink",
        defaultMinSelections: 1,
        defaultMaxSelections: 1,
        defaultSelectionMode: SelectionMode.SINGLE,
        isActive: true,
        translations: {
          create: [
            { locale: "en", name: "Choose your drink" },
            { locale: "pl", name: "Wybierz napoj" },
          ],
        },
      },
    }),
  };

  const burgerMealGroups = {
    sandwich: await prisma.productGroup.create({
      data: {
        productId: products.burgerMeal.id,
        productGroupTemplateId: groupTemplates.sandwich.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 1,
        isRequired: true,
      },
    }),
    side: await prisma.productGroup.create({
      data: {
        productId: products.burgerMeal.id,
        productGroupTemplateId: groupTemplates.side.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 2,
        isRequired: true,
      },
    }),
    drink: await prisma.productGroup.create({
      data: {
        productId: products.burgerMeal.id,
        productGroupTemplateId: groupTemplates.drink.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 3,
        isRequired: true,
      },
    }),
  };

  const largeBurgerMealGroups = {
    sandwich: await prisma.productGroup.create({
      data: {
        productId: products.largeBurgerMeal.id,
        productGroupTemplateId: groupTemplates.sandwich.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 1,
        isRequired: true,
      },
    }),
    side: await prisma.productGroup.create({
      data: {
        productId: products.largeBurgerMeal.id,
        productGroupTemplateId: groupTemplates.side.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 2,
        isRequired: true,
      },
    }),
    drink: await prisma.productGroup.create({
      data: {
        productId: products.largeBurgerMeal.id,
        productGroupTemplateId: groupTemplates.drink.id,
        minSelections: 1,
        maxSelections: 1,
        selectionMode: SelectionMode.SINGLE,
        sortOrder: 3,
        isRequired: true,
      },
    }),
  };

  for (const groupId of [burgerMealGroups.sandwich.id, largeBurgerMealGroups.sandwich.id]) {
    await prisma.productGroupOption.createMany({
      data: [
        {
          productGroupId: groupId,
          productId: products.classicBurger.id,
          priceAdjustment: decimal("0"),
          sortOrder: 1,
          isDefault: true,
          isAvailable: true,
        },
        {
          productGroupId: groupId,
          productId: products.cheeseBurger.id,
          priceAdjustment: decimal("1.50"),
          sortOrder: 2,
          isDefault: false,
          isAvailable: true,
        },
      ],
    });
  }

  for (const groupId of [burgerMealGroups.side.id, largeBurgerMealGroups.side.id]) {
    await prisma.productGroupOption.createMany({
      data: [
        {
          productGroupId: groupId,
          productId: products.fries.id,
          priceAdjustment: decimal("0"),
          sortOrder: 1,
          isDefault: true,
          isAvailable: true,
        },
        {
          productGroupId: groupId,
          productId: products.sideSalad.id,
          priceAdjustment: decimal("0.90"),
          sortOrder: 2,
          isDefault: false,
          isAvailable: true,
        },
      ],
    });
  }

  for (const groupId of [burgerMealGroups.drink.id, largeBurgerMealGroups.drink.id]) {
    await prisma.productGroupOption.createMany({
      data: [
        {
          productGroupId: groupId,
          productId: products.cola.id,
          priceAdjustment: decimal("0"),
          sortOrder: 1,
          isDefault: true,
          isAvailable: true,
        },
        {
          productGroupId: groupId,
          productId: products.orangeJuice.id,
          priceAdjustment: decimal("1.20"),
          sortOrder: 2,
          isDefault: false,
          isAvailable: true,
        },
      ],
    });
  }

  const classicBurgerIngredients = {
    bun: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.bun.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: false,
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 1,
        isAvailable: true,
      },
    }),
    beefPatty: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.beefPatty.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: false,
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 2,
        isAvailable: true,
      },
    }),
    lettuce: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.lettuce.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 3,
        isAvailable: true,
      },
    }),
    tomato: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.tomato.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 4,
        isAvailable: true,
      },
    }),
    pickles: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.pickles.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: true,
        extraUnitPrice: decimal("0.50"),
        maxExtraQuantity: 2,
        sortOrder: 5,
        isAvailable: true,
      },
    }),
    ketchup: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.ketchup.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 6,
        isAvailable: true,
      },
    }),
    cheddar: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.cheddar.id,
        defaultQuantity: 0,
        isDefaultIncluded: false,
        isRemovable: false,
        allowExtra: true,
        extraUnitPrice: decimal("1.80"),
        maxExtraQuantity: 2,
        sortOrder: 7,
        isAvailable: true,
      },
    }),
    bacon: await prisma.productIngredient.create({
      data: {
        productId: products.classicBurger.id,
        ingredientId: ingredients.bacon.id,
        defaultQuantity: 0,
        isDefaultIncluded: false,
        isRemovable: false,
        allowExtra: true,
        extraUnitPrice: decimal("2.50"),
        maxExtraQuantity: 2,
        sortOrder: 8,
        isAvailable: true,
      },
    }),
  };

  const cheeseBurgerIngredients = {
    bun: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.bun.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: false,
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 1,
        isAvailable: true,
      },
    }),
    beefPatty: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.beefPatty.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: false,
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 2,
        isAvailable: true,
      },
    }),
    cheddar: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.cheddar.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: true,
        extraUnitPrice: decimal("1.80"),
        maxExtraQuantity: 2,
        sortOrder: 3,
        isAvailable: true,
      },
    }),
    pickles: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.pickles.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: true,
        extraUnitPrice: decimal("0.50"),
        maxExtraQuantity: 2,
        sortOrder: 4,
        isAvailable: true,
      },
    }),
    ketchup: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.ketchup.id,
        defaultQuantity: 1,
        isDefaultIncluded: true,
        isRemovable: true,
        removePriceAdjustment: decimal("0"),
        allowExtra: false,
        extraUnitPrice: decimal("0"),
        maxExtraQuantity: 0,
        sortOrder: 5,
        isAvailable: true,
      },
    }),
    bacon: await prisma.productIngredient.create({
      data: {
        productId: products.cheeseBurger.id,
        ingredientId: ingredients.bacon.id,
        defaultQuantity: 0,
        isDefaultIncluded: false,
        isRemovable: false,
        allowExtra: true,
        extraUnitPrice: decimal("2.50"),
        maxExtraQuantity: 2,
        sortOrder: 6,
        isAvailable: true,
      },
    }),
  };

  const classicRemoveGroup = await prisma.modifierGroup.create({
    data: {
      productId: products.classicBurger.id,
      name: "Remove ingredients",
      actionType: ModifierActionType.REMOVE,
      selectionType: SelectionMode.MULTIPLE,
      minSelections: 0,
      maxSelections: 4,
      allowQuantity: false,
      sortOrder: 1,
      isRequired: false,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      {
        modifierGroupId: classicRemoveGroup.id,
        ingredientId: ingredients.lettuce.id,
        productIngredientId: classicBurgerIngredients.lettuce.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        modifierGroupId: classicRemoveGroup.id,
        ingredientId: ingredients.tomato.id,
        productIngredientId: classicBurgerIngredients.tomato.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 2,
        isAvailable: true,
      },
      {
        modifierGroupId: classicRemoveGroup.id,
        ingredientId: ingredients.pickles.id,
        productIngredientId: classicBurgerIngredients.pickles.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 3,
        isAvailable: true,
      },
      {
        modifierGroupId: classicRemoveGroup.id,
        ingredientId: ingredients.ketchup.id,
        productIngredientId: classicBurgerIngredients.ketchup.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 4,
        isAvailable: true,
      },
    ],
  });

  const classicAddGroup = await prisma.modifierGroup.create({
    data: {
      productId: products.classicBurger.id,
      name: "Add extras",
      actionType: ModifierActionType.ADD,
      selectionType: SelectionMode.MULTIPLE,
      minSelections: 0,
      maxSelections: 4,
      allowQuantity: true,
      sortOrder: 2,
      isRequired: false,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      {
        modifierGroupId: classicAddGroup.id,
        ingredientId: ingredients.cheddar.id,
        productIngredientId: classicBurgerIngredients.cheddar.id,
        priceAdjustment: decimal("1.80"),
        maxQuantity: 2,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        modifierGroupId: classicAddGroup.id,
        ingredientId: ingredients.bacon.id,
        productIngredientId: classicBurgerIngredients.bacon.id,
        priceAdjustment: decimal("2.50"),
        maxQuantity: 2,
        sortOrder: 2,
        isAvailable: true,
      },
      {
        modifierGroupId: classicAddGroup.id,
        ingredientId: ingredients.pickles.id,
        productIngredientId: classicBurgerIngredients.pickles.id,
        priceAdjustment: decimal("0.50"),
        maxQuantity: 2,
        sortOrder: 3,
        isAvailable: true,
      },
    ],
  });

  const cheeseRemoveGroup = await prisma.modifierGroup.create({
    data: {
      productId: products.cheeseBurger.id,
      name: "Remove ingredients",
      actionType: ModifierActionType.REMOVE,
      selectionType: SelectionMode.MULTIPLE,
      minSelections: 0,
      maxSelections: 3,
      allowQuantity: false,
      sortOrder: 1,
      isRequired: false,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      {
        modifierGroupId: cheeseRemoveGroup.id,
        ingredientId: ingredients.cheddar.id,
        productIngredientId: cheeseBurgerIngredients.cheddar.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        modifierGroupId: cheeseRemoveGroup.id,
        ingredientId: ingredients.pickles.id,
        productIngredientId: cheeseBurgerIngredients.pickles.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 2,
        isAvailable: true,
      },
      {
        modifierGroupId: cheeseRemoveGroup.id,
        ingredientId: ingredients.ketchup.id,
        productIngredientId: cheeseBurgerIngredients.ketchup.id,
        priceAdjustment: decimal("0"),
        maxQuantity: 1,
        sortOrder: 3,
        isAvailable: true,
      },
    ],
  });

  const cheeseAddGroup = await prisma.modifierGroup.create({
    data: {
      productId: products.cheeseBurger.id,
      name: "Add extras",
      actionType: ModifierActionType.ADD,
      selectionType: SelectionMode.MULTIPLE,
      minSelections: 0,
      maxSelections: 3,
      allowQuantity: true,
      sortOrder: 2,
      isRequired: false,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      {
        modifierGroupId: cheeseAddGroup.id,
        ingredientId: ingredients.cheddar.id,
        productIngredientId: cheeseBurgerIngredients.cheddar.id,
        priceAdjustment: decimal("1.80"),
        maxQuantity: 2,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        modifierGroupId: cheeseAddGroup.id,
        ingredientId: ingredients.bacon.id,
        productIngredientId: cheeseBurgerIngredients.bacon.id,
        priceAdjustment: decimal("2.50"),
        maxQuantity: 2,
        sortOrder: 2,
        isAvailable: true,
      },
    ],
  });

  console.log("Database seeded successfully.");
  console.log(`Restaurant: ${restaurant.name}`);
  console.log(`Menu: ${mainMenu.name}`);
  console.log(
    `Menu products seeded: ${Object.keys(menuProducts).length}, ingredients seeded: ${Object.keys(ingredients).length}`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
