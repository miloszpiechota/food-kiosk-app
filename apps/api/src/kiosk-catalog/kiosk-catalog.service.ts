import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActiveMenuResponse,
  MenuCategoryListResponse,
  MenuCategoryProductsResponse,
  MenuProductDetailResponse,
  MenuProductSummary,
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
        isVisible: true,
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

    return {
      ...summary,
      menuId: menuProduct.menuCategory.menuId,
      menuCategoryId: menuProduct.menuCategoryId,
      categoryId: menuProduct.menuCategory.categoryId,
      locale: resolvedLocale,
      isAvailable: menuProduct.product.isAvailable,
      groups: menuProduct.product.productGroups.map((group) => ({
        id: group.id,
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
            name: optionText.name,
            priceAdjustment: this.formatDecimal(option.priceAdjustment),
            isDefault: option.isDefault,
            sortOrder: option.sortOrder,
          };
        }),
      })),
      ingredients: menuProduct.product.productIngredients.map(
        (productIngredient) => ({
          id: productIngredient.id,
          ingredientId: productIngredient.ingredientId,
          code: productIngredient.ingredient.code,
          name: this.resolveName(
            productIngredient.ingredient.name,
            productIngredient.ingredient.translations,
            resolvedLocale,
            restaurant.defaultLocale,
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
        }),
      ),
      modifierGroups: menuProduct.product.modifierGroups.map(
        (modifierGroup) => ({
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
                    resolvedLocale,
                    restaurant.defaultLocale,
                  )
                : null,
              priceAdjustment: this.formatDecimal(option.priceAdjustment),
              maxQuantity: option.maxQuantity,
              sortOrder: option.sortOrder,
            };
          }),
        }),
      ),
    };
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
        basePrice: DecimalLike;
        imageUrl: string | null;
        translations: readonly TranslationFields[];
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
      price: this.formatDecimal(
        menuProduct.menuPrice ?? menuProduct.product.basePrice,
      ),
      currencyCode,
      imageUrl: menuProduct.product.imageUrl,
      sortOrder: menuProduct.sortOrder,
    };
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
}
