import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole, Prisma, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import type {
  AdminMenuProductListResponse,
  AdminMenuProductSummary,
  UpdateAdminMenuVisibilityRequest,
  UpdateAdminMenuVisibilityResponse,
} from './admin-menu.types';

type MenuProductRecord = Prisma.MenuProductGetPayload<{
  include: {
    menuCategory: {
      include: {
        category: true;
        menu: {
          include: {
            restaurant: true;
          };
        };
      };
    };
    product: {
      include: {
        translations: true;
        productGroups: {
          include: {
            options: {
              include: {
                product: {
                  include: {
                    menuProducts: {
                      include: {
                        menuCategory: true;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class AdminMenuService {
  constructor(private readonly prisma: PrismaService) {}

  async listMenuProducts(
    actor: AdminAuthenticatedSession,
  ): Promise<AdminMenuProductListResponse> {
    const products = await this.prisma.menuProduct.findMany({
      where: this.accessibleMenuProductWhere(actor),
      orderBy: [
        { menuCategory: { menu: { restaurant: { name: 'asc' } } } },
        { menuCategory: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      include: this.menuProductInclude(),
    });

    const forcedHiddenIds = this.resolveForcedHiddenMenuProductIds(products);

    return {
      products: products.map((product) =>
        this.toMenuProductSummary(product, forcedHiddenIds),
      ),
    };
  }

  async updateMenuProductVisibility(
    actor: AdminAuthenticatedSession,
    request: UpdateAdminMenuVisibilityRequest,
  ): Promise<UpdateAdminMenuVisibilityResponse> {
    const changes = this.validateChanges(request);
    const ids = changes.map((change) => change.menuProductId);
    const existing = await this.prisma.menuProduct.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        menuCategory: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (existing.length !== ids.length) {
      throw new NotFoundException({
        code: 'ADMIN_MENU_PRODUCT_NOT_FOUND',
        message: 'One or more menu products were not found.',
      });
    }
    for (const menuProduct of existing) {
      this.assertRestaurantAccess(
        actor,
        menuProduct.menuCategory.menu.restaurantId,
      );
    }

    const products = await this.prisma.$transaction(async (transaction) => {
      for (const change of changes) {
        await transaction.menuProduct.update({
          where: { id: change.menuProductId },
          data: { isVisible: change.isVisible },
        });
      }

      const changedRestaurantIds = [
        ...new Set(existing.map((item) => item.menuCategory.menu.restaurantId)),
      ];
      const afterRequestedChanges = await transaction.menuProduct.findMany({
        where: this.accessibleMenuProductWhere(actor, changedRestaurantIds),
        include: this.menuProductInclude(),
      });
      const forcedHiddenIds = this.resolveForcedHiddenMenuProductIds(
        afterRequestedChanges,
      );

      if (forcedHiddenIds.size > 0) {
        await transaction.menuProduct.updateMany({
          where: {
            id: { in: [...forcedHiddenIds] },
            isVisible: true,
          },
          data: {
            isVisible: false,
          },
        });
      }

      return transaction.menuProduct.findMany({
        where: this.accessibleMenuProductWhere(actor),
        orderBy: [
          { menuCategory: { menu: { restaurant: { name: 'asc' } } } },
          { menuCategory: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
        include: this.menuProductInclude(),
      });
    });
    const forcedHiddenIds = this.resolveForcedHiddenMenuProductIds(products);

    return {
      products: products.map((product) =>
        this.toMenuProductSummary(product, forcedHiddenIds),
      ),
      updatedCount: changes.length,
      forcedHiddenMenuProductIds: [...forcedHiddenIds],
    };
  }

  private validateChanges(
    request: UpdateAdminMenuVisibilityRequest,
  ): Array<{ menuProductId: string; isVisible: boolean }> {
    if (!Array.isArray(request.changes) || request.changes.length === 0) {
      throw new BadRequestException({
        code: 'ADMIN_MENU_VISIBILITY_CHANGES_REQUIRED',
        message: 'At least one visibility change is required.',
      });
    }
    if (request.changes.length > 100) {
      throw new BadRequestException({
        code: 'ADMIN_MENU_VISIBILITY_CHANGES_LIMIT',
        message: 'No more than 100 visibility changes can be saved at once.',
      });
    }

    return request.changes.map((change) => {
      if (!change.menuProductId?.trim()) {
        throw new BadRequestException({
          code: 'ADMIN_MENU_PRODUCT_ID_REQUIRED',
          message: 'Menu product id is required.',
        });
      }
      if (typeof change.isVisible !== 'boolean') {
        throw new BadRequestException({
          code: 'ADMIN_MENU_VISIBILITY_INVALID',
          message: 'Menu product visibility must be true or false.',
        });
      }

      return {
        menuProductId: change.menuProductId.trim(),
        isVisible: change.isVisible,
      };
    });
  }

  private accessibleMenuProductWhere(
    actor: AdminAuthenticatedSession,
    restaurantIds?: string[],
  ): Prisma.MenuProductWhereInput {
    const allowedRestaurantIds =
      actor.user.role === AdminRole.SUPER_ADMIN
        ? restaurantIds
        : restaurantIds
          ? restaurantIds.filter((id) => actor.user.restaurantIds.includes(id))
          : actor.user.restaurantIds;

    return {
      menuCategory: {
        menu: {
          restaurantId: allowedRestaurantIds
            ? { in: allowedRestaurantIds }
            : undefined,
        },
      },
    };
  }

  private assertRestaurantAccess(
    actor: AdminAuthenticatedSession,
    restaurantId: string,
  ): void {
    if (
      actor.user.role !== AdminRole.SUPER_ADMIN &&
      !actor.user.restaurantIds.includes(restaurantId)
    ) {
      throw new ForbiddenException({
        code: 'ADMIN_RESTAURANT_FORBIDDEN',
        message: 'You do not have access to this restaurant.',
      });
    }
  }

  private resolveForcedHiddenMenuProductIds(
    products: MenuProductRecord[],
  ): Set<string> {
    const visibleProductIdsByMenuId = new Map<string, Set<string>>();
    for (const menuProduct of products) {
      if (!menuProduct.isVisible || !menuProduct.product.isAvailable) {
        continue;
      }

      const menuId = menuProduct.menuCategory.menuId;
      const ids = visibleProductIdsByMenuId.get(menuId) ?? new Set<string>();
      ids.add(menuProduct.productId);
      visibleProductIdsByMenuId.set(menuId, ids);
    }

    const hiddenIds = new Set<string>();
    for (const menuProduct of products) {
      if (
        menuProduct.product.type !== ProductType.MEAL &&
        menuProduct.product.type !== ProductType.LARGE_MEAL
      ) {
        continue;
      }

      if (
        !this.isMealOrderable(
          menuProduct,
          visibleProductIdsByMenuId.get(menuProduct.menuCategory.menuId) ??
            new Set(),
        )
      ) {
        hiddenIds.add(menuProduct.id);
      }
    }

    return hiddenIds;
  }

  private isMealOrderable(
    menuProduct: MenuProductRecord,
    visibleProductIdsInMenu: Set<string>,
  ): boolean {
    if (!menuProduct.product.isAvailable) {
      return false;
    }

    const requiredGroups = menuProduct.product.productGroups.filter(
      (group) => group.isRequired && group.minSelections > 0,
    );
    if (requiredGroups.length === 0) {
      return true;
    }

    return requiredGroups.every((group) => {
      const visibleOptionCount = group.options.filter(
        (option) =>
          option.isAvailable &&
          option.product.isAvailable &&
          visibleProductIdsInMenu.has(option.productId),
      ).length;

      return visibleOptionCount >= group.minSelections;
    });
  }

  private toMenuProductSummary(
    menuProduct: MenuProductRecord,
    forcedHiddenIds: Set<string>,
  ): AdminMenuProductSummary {
    const restaurant = menuProduct.menuCategory.menu.restaurant;
    const name =
      menuProduct.product.translations.find(
        (translation) => translation.locale === restaurant.defaultLocale,
      )?.name ?? menuProduct.product.name;

    return {
      menuProductId: menuProduct.id,
      productId: menuProduct.productId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      categoryName: menuProduct.menuCategory.category.name,
      type: menuProduct.product.type,
      sku: menuProduct.product.sku,
      name,
      price: (
        menuProduct.menuPrice ?? menuProduct.product.basePrice
      ).toString(),
      currencyCode: restaurant.currencyCode,
      imageUrl: menuProduct.product.imageUrl,
      isVisible: menuProduct.isVisible && !forcedHiddenIds.has(menuProduct.id),
      forcedHiddenReason: forcedHiddenIds.has(menuProduct.id)
        ? 'This meal has no visible option in at least one required group.'
        : null,
    };
  }

  private menuProductInclude() {
    return {
      menuCategory: {
        include: {
          category: true,
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
            include: {
              options: {
                include: {
                  product: {
                    include: {
                      menuProducts: {
                        include: {
                          menuCategory: true,
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
    } satisfies Prisma.MenuProductInclude;
  }
}
