import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActiveMenuResponse,
  MealSizeVariantResponse,
  MenuCategoryListResponse,
  MenuCategoryProductsResponse,
  MenuProductDetailResponse,
  MenuProductSummary,
  ModifierGroupResponse,
  ProductIngredientResponse,
  ProductLabelResponse,
} from './kiosk-catalog.types';

interface TranslationFields {
  locale: string;
  name: string;
  description?: string | null;
}

interface NameTranslationFields {
  locale: string;
  name: string;
}

interface NamedRecord {
  name: string;
  description?: string | null;
}

interface DecimalLike {
  toString(): string;
}

interface MealVariantRecord extends NamedRecord {
  id: string;
  type: string;
  basePrice: DecimalLike;
  imageUrl: string | null;
  translations: readonly TranslationFields[];
  menuProducts: Array<{
    id: string;
    menuPrice: DecimalLike | null;
    menuCategory: {
      menuId: string;
    };
  }>;
}

interface ProductIngredientRecord {
  id: string;
  ingredientId: string;
  defaultQuantity: number;
  isDefaultIncluded: boolean;
  isRemovable: boolean;
  removePriceAdjustment: DecimalLike;
  allowExtra: boolean;
  extraUnitPrice: DecimalLike;
  maxExtraQuantity: number;
  sortOrder: number;
  ingredient: {
    code: string;
    name: string;
    translations: readonly NameTranslationFields[];
  };
}

interface ModifierOptionRecord {
  id: string;
  ingredientId: string | null;
  productIngredientId: string | null;
  priceAdjustment: DecimalLike;
  maxQuantity: number;
  sortOrder: number;
  ingredient: {
    name: string;
    translations: readonly NameTranslationFields[];
  } | null;
  productIngredient: {
    ingredient: {
      name: string;
      translations: readonly NameTranslationFields[];
    };
  } | null;
}

interface ModifierGroupRecord {
  id: string;
  name: string;
  actionType: string;
  selectionType: string;
  minSelections: number;
  maxSelections: number;
  allowQuantity: boolean;
  isRequired: boolean;
  sortOrder: number;
  options: ModifierOptionRecord[];
}

@Injectable()
export class KioskCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveMenu(locale?: string): Promise<ActiveMenuResponse> {
    const menu = await this.prisma.menu.findFirst({
      where: {
        isActive: true,
        restaurant: {
          isActive: true,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        restaurant: true,
        translations: true,
      },
    });

    if (!menu) {
      throw new NotFoundException('Active menu was not found');
    }

    const resolvedLocale = this.resolveLocale(
      locale,
      menu.restaurant.defaultLocale,
    );
    const text = this.resolveNameDescription(
      menu,
      menu.translations,
      resolvedLocale,
      menu.restaurant.defaultLocale,
    );

    return {
      id: menu.id,
      code: menu.code,
      name: text.name,
      description: text.description,
      locale: resolvedLocale,
      defaultLocale: menu.restaurant.defaultLocale,
      currencyCode: menu.restaurant.currencyCode,
    };
  }

  async getMenuCategories(
    menuId: string,
    locale?: string,
  ): Promise<MenuCategoryListResponse> {
    const menu = await this.prisma.menu.findFirst({
      where: {
        id: menuId,
        isActive: true,
        restaurant: {
          isActive: true,
        },
      },
      include: {
        restaurant: true,
      },
    });

    if (!menu) {
      throw new NotFoundException('Active menu was not found');
    }

    const resolvedLocale = this.resolveLocale(
      locale,
      menu.restaurant.defaultLocale,
    );
    const menuCategories = await this.prisma.menuCategory.findMany({
      where: {
        menuId,
        isVisible: true,
        category: {
          isActive: true,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        category: {
          include: {
            translations: true,
          },
        },
      },
    });

    return {
      menuId,
      locale: resolvedLocale,
      categories: menuCategories.map((menuCategory) => {
        const text = this.resolveNameDescription(
          menuCategory.category,
          menuCategory.category.translations,
          resolvedLocale,
          menu.restaurant.defaultLocale,
        );

        return {
          menuCategoryId: menuCategory.id,
          categoryId: menuCategory.categoryId,
          code: menuCategory.category.code,
          name: text.name,
          description: text.description,
          sortOrder: menuCategory.sortOrder,
        };
      }),
    };
  }

  async getMenuCategoryProducts(
    menuCategoryId: string,
    locale?: string,
  ): Promise<MenuCategoryProductsResponse> {
    const menuCategory = await this.prisma.menuCategory.findFirst({
      where: {
        id: menuCategoryId,
        isVisible: true,
        category: {
          isActive: true,
        },
        menu: {
          isActive: true,
          restaurant: {
            isActive: true,
          },
        },
      },
      include: {
        menu: {
          include: {
            restaurant: true,
          },
        },
        menuProducts: {
          where: {
            isVisible: true,
            product: {
              isAvailable: true,
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            product: {
              include: {
                translations: true,
                _count: {
                  select: {
                    productGroups: true,
                    modifierGroups: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!menuCategory) {
      throw new NotFoundException('Visible menu category was not found');
    }

    const restaurant = menuCategory.menu.restaurant;
    const resolvedLocale = this.resolveLocale(locale, restaurant.defaultLocale);

    return {
      menuCategoryId: menuCategory.id,
      categoryId: menuCategory.categoryId,
      locale: resolvedLocale,
      products: menuCategory.menuProducts.map((menuProduct) =>
        this.toMenuProductSummary(
          menuProduct,
          restaurant.currencyCode,
          resolvedLocale,
          restaurant.defaultLocale,
        ),
      ),
    };
  }

  async getMenuProductDetail(
    menuProductId: string,
    locale?: string,
  ): Promise<MenuProductDetailResponse> {
    const menuProduct = await this.prisma.menuProduct.findFirst({
      where: {
        id: menuProductId,
        OR: [
          { isVisible: true },
          {
            product: {
              type: 'LARGE_MEAL',
              regularMeal: {
                menuProducts: {
                  some: {
                    isVisible: true,
                  },
                },
              },
            },
          },
        ],
        menuCategory: {
          isVisible: true,
          category: {
            isActive: true,
          },
          menu: {
            isActive: true,
            restaurant: {
              isActive: true,
            },
          },
        },
        product: {
          isAvailable: true,
        },
      },
      include: {
        menuCategory: {
          include: {
            menu: {
              include: {
                restaurant: true,
              },
            },
          },
        },
        product: {
          include: {
            translations: true,
            regularMeal: {
              include: {
                translations: true,
                menuProducts: {
                  include: {
                    menuCategory: true,
                  },
                },
              },
            },
            largeMealVariant: {
              include: {
                translations: true,
                menuProducts: {
                  include: {
                    menuCategory: true,
                  },
                },
              },
            },
            productGroups: {
              orderBy: [{ sortOrder: 'asc' }],
              include: {
                productGroupTemplate: {
                  include: {
                    translations: true,
                  },
                },
                options: {
                  where: {
                    isAvailable: true,
                    product: {
                      isAvailable: true,
                    },
                  },
                  orderBy: [{ sortOrder: 'asc' }],
                  include: {
                    product: {
                      include: {
                        translations: true,
                        productIngredients: {
                          where: {
                            isAvailable: true,
                            ingredient: {
                              isActive: true,
                            },
                          },
                          orderBy: [{ sortOrder: 'asc' }],
                          include: {
                            ingredient: {
                              include: {
                                translations: true,
                              },
                            },
                          },
                        },
                        modifierGroups: {
                          orderBy: [{ sortOrder: 'asc' }],
                          include: {
                            options: {
                              where: {
                                isAvailable: true,
                              },
                              orderBy: [{ sortOrder: 'asc' }],
                              include: {
                                ingredient: {
                                  include: {
                                    translations: true,
                                  },
                                },
                                productIngredient: {
                                  include: {
                                    ingredient: {
                                      include: {
                                        translations: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            productIngredients: {
              where: {
                isAvailable: true,
                ingredient: {
                  isActive: true,
                },
              },
              orderBy: [{ sortOrder: 'asc' }],
              include: {
                ingredient: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
            modifierGroups: {
              orderBy: [{ sortOrder: 'asc' }],
              include: {
                options: {
                  where: {
                    isAvailable: true,
                  },
                  orderBy: [{ sortOrder: 'asc' }],
                  include: {
                    ingredient: {
                      include: {
                        translations: true,
                      },
                    },
                    productIngredient: {
                      include: {
                        ingredient: {
                          include: {
                            translations: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!menuProduct) {
      throw new NotFoundException('Menu product was not found');
    }

    const restaurant = menuProduct.menuCategory.menu.restaurant;
    const resolvedLocale = this.resolveLocale(locale, restaurant.defaultLocale);
    const summary = this.toMenuProductSummary(
      menuProduct,
      restaurant.currencyCode,
      resolvedLocale,
      restaurant.defaultLocale,
    );
    this.validateMealDefinition(menuProduct.product);

    return {
      ...summary,
      menuId: menuProduct.menuCategory.menuId,
      menuCategoryId: menuProduct.menuCategoryId,
      categoryId: menuProduct.menuCategory.categoryId,
      locale: resolvedLocale,
      isAvailable: menuProduct.product.isAvailable,
      groups: menuProduct.product.productGroups.map((group) => ({
        id: group.id,
        code: group.productGroupTemplate.code,
        name:
          group.nameOverride ??
          this.resolveName(
            group.productGroupTemplate.name,
            group.productGroupTemplate.translations,
            resolvedLocale,
            restaurant.defaultLocale,
          ),
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        selectionMode: group.selectionMode,
        isRequired: group.isRequired,
        sortOrder: group.sortOrder,
        options: group.options.map((option) => {
          const optionText = this.resolveNameDescription(
            option.product,
            option.product.translations,
            resolvedLocale,
            restaurant.defaultLocale,
          );

          return {
            id: option.id,
            productId: option.productId,
            type: option.product.type,
            name: optionText.name,
            imageUrl: option.product.imageUrl,
            priceAdjustment: this.formatDecimal(option.priceAdjustment),
            isInitialSelection: group.options[0]?.id === option.id,
            sortOrder: option.sortOrder,
            ingredients: this.toProductIngredients(
              option.product.productIngredients,
              resolvedLocale,
              restaurant.defaultLocale,
            ),
            modifierGroups: this.toModifierGroups(
              option.product.modifierGroups,
              resolvedLocale,
              restaurant.defaultLocale,
            ),
          };
        }),
      })),
      ingredients: this.toProductIngredients(
        menuProduct.product.productIngredients,
        resolvedLocale,
        restaurant.defaultLocale,
      ),
      modifierGroups: this.toModifierGroups(
        menuProduct.product.modifierGroups,
        resolvedLocale,
        restaurant.defaultLocale,
      ),
      regularMeal: this.toMealSizeVariant(
        menuProduct.product.regularMeal,
        menuProduct.menuCategory.menuId,
        resolvedLocale,
        restaurant.defaultLocale,
      ),
      largeMeal: this.toMealSizeVariant(
        menuProduct.product.largeMealVariant,
        menuProduct.menuCategory.menuId,
        resolvedLocale,
        restaurant.defaultLocale,
      ),
    };
  }

  private validateMealDefinition(product: {
    type: string;
    productGroups: Array<{
      minSelections: number;
      maxSelections: number;
      selectionMode: string;
      isRequired: boolean;
      options: unknown[];
    }>;
  }): void {
    if (product.type === 'ITEM') {
      return;
    }

    const validGroupCount =
      product.productGroups.length >= 2 && product.productGroups.length <= 4;
    const validGroups = product.productGroups.every(
      (group) =>
        group.minSelections === 1 &&
        group.maxSelections === 1 &&
        group.selectionMode === 'SINGLE' &&
        group.isRequired &&
        group.options.length > 0,
    );

    if (!validGroupCount || !validGroups) {
      throw new UnprocessableEntityException({
        code: 'INVALID_MEAL_DEFINITION',
        message: 'This meal is not configured correctly.',
      });
    }
  }

  private toMealSizeVariant(
    product: MealVariantRecord | null,
    menuId: string,
    locale: string,
    defaultLocale: string,
  ): MealSizeVariantResponse | null {
    if (!product) {
      return null;
    }

    const menuProduct = product.menuProducts.find(
      (candidate) => candidate.menuCategory.menuId === menuId,
    );
    if (!menuProduct) {
      return null;
    }

    return {
      menuProductId: menuProduct.id,
      productId: product.id,
      type: product.type,
      name: this.resolveNameDescription(
        product,
        product.translations,
        locale,
        defaultLocale,
      ).name,
      price: this.formatDecimal(menuProduct.menuPrice ?? product.basePrice),
      imageUrl: product.imageUrl,
    };
  }

  private toProductIngredients(
    productIngredients: ProductIngredientRecord[],
    locale: string,
    defaultLocale: string,
  ): ProductIngredientResponse[] {
    return productIngredients.map((productIngredient) => ({
      id: productIngredient.id,
      ingredientId: productIngredient.ingredientId,
      code: productIngredient.ingredient.code,
      name: this.resolveName(
        productIngredient.ingredient.name,
        productIngredient.ingredient.translations,
        locale,
        defaultLocale,
      ),
      defaultQuantity: productIngredient.defaultQuantity,
      isDefaultIncluded: productIngredient.isDefaultIncluded,
      isRemovable: productIngredient.isRemovable,
      removePriceAdjustment: this.formatDecimal(
        productIngredient.removePriceAdjustment,
      ),
      allowExtra: productIngredient.allowExtra,
      extraUnitPrice: this.formatDecimal(productIngredient.extraUnitPrice),
      maxExtraQuantity: productIngredient.maxExtraQuantity,
      sortOrder: productIngredient.sortOrder,
    }));
  }

  private toModifierGroups(
    modifierGroups: ModifierGroupRecord[],
    locale: string,
    defaultLocale: string,
  ): ModifierGroupResponse[] {
    return modifierGroups.map((modifierGroup) => ({
      id: modifierGroup.id,
      name: modifierGroup.name,
      actionType: modifierGroup.actionType,
      selectionType: modifierGroup.selectionType,
      minSelections: modifierGroup.minSelections,
      maxSelections: modifierGroup.maxSelections,
      allowQuantity: modifierGroup.allowQuantity,
      isRequired: modifierGroup.isRequired,
      sortOrder: modifierGroup.sortOrder,
      options: modifierGroup.options.map((option) => {
        const ingredient =
          option.ingredient ?? option.productIngredient?.ingredient ?? null;

        return {
          id: option.id,
          ingredientId: option.ingredientId,
          productIngredientId: option.productIngredientId,
          name: ingredient
            ? this.resolveName(
                ingredient.name,
                ingredient.translations,
                locale,
                defaultLocale,
              )
            : null,
          priceAdjustment: this.formatDecimal(option.priceAdjustment),
          maxQuantity: option.maxQuantity,
          sortOrder: option.sortOrder,
        };
      }),
    }));
  }

  private toMenuProductSummary(
    menuProduct: {
      id: string;
      productId: string;
      menuPrice: DecimalLike | null;
      sortOrder: number;
      product: {
        id: string;
        type: string;
        sku: string;
        name: string;
        description: string | null;
        label: string | null;
        basePrice: DecimalLike;
        imageUrl: string | null;
        translations: readonly TranslationFields[];
        _count?: {
          productGroups: number;
          modifierGroups: number;
        };
        productGroups?: unknown[];
        modifierGroups?: unknown[];
      };
    },
    currencyCode: string,
    locale: string,
    defaultLocale: string,
  ): MenuProductSummary {
    const text = this.resolveNameDescription(
      menuProduct.product,
      menuProduct.product.translations,
      locale,
      defaultLocale,
    );

    return {
      menuProductId: menuProduct.id,
      productId: menuProduct.product.id,
      type: menuProduct.product.type,
      sku: menuProduct.product.sku,
      name: text.name,
      description: text.description,
      label: this.formatProductLabel(menuProduct.product.label),
      price: this.formatDecimal(
        menuProduct.menuPrice ?? menuProduct.product.basePrice,
      ),
      currencyCode,
      imageUrl: menuProduct.product.imageUrl,
      sortOrder: menuProduct.sortOrder,
      hasCustomizations: this.hasCustomizations(menuProduct.product),
    };
  }

  private hasCustomizations(product: {
    type: string;
    _count?: {
      productGroups: number;
      modifierGroups: number;
    };
    productGroups?: unknown[];
    modifierGroups?: unknown[];
  }): boolean {
    if (product.type !== 'ITEM') {
      return true;
    }

    const productGroupCount =
      product._count?.productGroups ?? product.productGroups?.length ?? 0;
    const modifierGroupCount =
      product._count?.modifierGroups ?? product.modifierGroups?.length ?? 0;

    return productGroupCount > 0 || modifierGroupCount > 0;
  }

  private resolveLocale(
    requestedLocale: string | undefined,
    defaultLocale: string,
  ): string {
    return requestedLocale?.trim() || defaultLocale;
  }

  private resolveNameDescription(
    baseRecord: NamedRecord,
    translations: readonly TranslationFields[],
    locale: string,
    defaultLocale: string,
  ): { name: string; description: string | null } {
    const translation = this.findBestTranslation(
      translations,
      locale,
      defaultLocale,
    );

    return {
      name: translation?.name ?? baseRecord.name,
      description: translation?.description ?? baseRecord.description ?? null,
    };
  }

  private resolveName(
    baseName: string,
    translations: readonly NameTranslationFields[],
    locale: string,
    defaultLocale: string,
  ): string {
    return (
      this.findBestTranslation(translations, locale, defaultLocale)?.name ??
      baseName
    );
  }

  private findBestTranslation<T extends NameTranslationFields>(
    translations: readonly T[],
    locale: string,
    defaultLocale: string,
  ): T | undefined {
    return (
      translations.find((translation) => translation.locale === locale) ??
      translations.find((translation) => translation.locale === defaultLocale)
    );
  }

  private formatDecimal(value: DecimalLike): string {
    return value.toString();
  }

  private formatProductLabel(
    label: string | null,
  ): ProductLabelResponse | null {
    switch (label) {
      case 'POPULAR':
        return 'Popular';
      case 'NEW':
        return 'New';
      case 'VEGETARIAN':
        return 'Vegetarian';
      default:
        return null;
    }
  }
}
