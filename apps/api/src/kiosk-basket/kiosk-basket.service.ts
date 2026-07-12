import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BasketStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddBasketItemRequest,
  BasketResponse,
  CreateBasketRequest,
  UpdateBasketItemQuantityRequest,
} from './kiosk-basket.types';
import { MealConfigurationService } from './meal-configuration.service';
import {
  configurableMenuProductInclude,
  ConfigurableMenuProduct,
} from './meal-configuration.query';

type BasketWithItems = Prisma.BasketGetPayload<{
  include: { items: true };
}>;

@Injectable()
export class KioskBasketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mealConfiguration: MealConfigurationService,
  ) {}

  async createBasket(request: CreateBasketRequest): Promise<BasketResponse> {
    const sessionId = request.sessionId?.trim() || randomUUID();
    const basket = await this.prisma.basket.create({
      data: {
        sessionId,
        status: BasketStatus.ACTIVE,
      },
      include: {
        items: true,
      },
    });

    return this.toBasketResponse(basket);
  }

  async getBasket(basketId: string): Promise<BasketResponse> {
    const basket = await this.prisma.basket.findFirst({
      where: {
        id: basketId,
        status: BasketStatus.ACTIVE,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!basket) {
      throw new NotFoundException({
        code: 'BASKET_NOT_ACTIVE',
        message: 'The active basket was not found.',
      });
    }

    return this.toBasketResponse(basket);
  }

  async addItem(
    basketId: string,
    request: AddBasketItemRequest,
  ): Promise<BasketResponse> {
    this.validateRequest(request);

    const [basket, menuProduct] = await Promise.all([
      this.prisma.basket.findFirst({
        where: {
          id: basketId,
          status: BasketStatus.ACTIVE,
        },
      }),
      this.loadMenuProduct(request.menuProductId),
    ]);

    if (!basket) {
      throw new NotFoundException({
        code: 'BASKET_NOT_ACTIVE',
        message: 'The active basket was not found.',
      });
    }
    if (!menuProduct) {
      throw new NotFoundException({
        code: 'MENU_PRODUCT_UNAVAILABLE',
        message: 'This product is no longer available.',
      });
    }

    const configuration = this.mealConfiguration.evaluate(menuProduct, request);

    return this.prisma
      .$transaction(async (transaction) => {
        const existing = await transaction.basketItem.findUnique({
          where: {
            basketId_menuProductId_configurationFingerprint: {
              basketId,
              menuProductId: menuProduct.id,
              configurationFingerprint: configuration.fingerprint,
            },
          },
        });
        const quantity = (existing?.quantity ?? 0) + request.quantity;
        const lineTotal = configuration.unitPrice.mul(quantity);

        if (existing) {
          await transaction.basketItem.update({
            where: { id: existing.id },
            data: {
              quantity,
              unitPrice: configuration.unitPrice,
              lineTotal,
              configurationSnapshot: configuration.snapshot,
            },
          });
        } else {
          await transaction.basketItem.create({
            data: {
              basketId,
              menuProductId: menuProduct.id,
              productId: menuProduct.product.id,
              productNameSnapshot: menuProduct.product.name,
              quantity,
              unitPrice: configuration.unitPrice,
              lineTotal,
              configurationFingerprint: configuration.fingerprint,
              configurationSnapshot: configuration.snapshot,
            },
          });
        }

        const totals = await transaction.basketItem.aggregate({
          where: { basketId },
          _sum: { lineTotal: true },
        });
        return transaction.basket.update({
          where: { id: basketId },
          data: {
            subtotalAmount: totals._sum.lineTotal ?? new Prisma.Decimal(0),
          },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      })
      .then((updatedBasket) => this.toBasketResponse(updatedBasket));
  }

  async updateItemQuantity(
    basketId: string,
    basketItemId: string,
    request: UpdateBasketItemQuantityRequest,
  ): Promise<BasketResponse> {
    this.validateQuantity(request.quantity);

    return this.prisma
      .$transaction(async (transaction) => {
        const item = await transaction.basketItem.findFirst({
          where: {
            id: basketItemId,
            basketId,
            basket: {
              status: BasketStatus.ACTIVE,
            },
          },
        });

        if (!item) {
          throw new NotFoundException({
            code: 'BASKET_ITEM_NOT_FOUND',
            message: 'The basket item was not found.',
          });
        }

        await transaction.basketItem.update({
          where: { id: basketItemId },
          data: {
            quantity: request.quantity,
            lineTotal: item.unitPrice.mul(request.quantity),
          },
        });

        return this.recalculateBasket(transaction, basketId);
      })
      .then((updatedBasket) => this.toBasketResponse(updatedBasket));
  }

  async removeItem(
    basketId: string,
    basketItemId: string,
  ): Promise<BasketResponse> {
    return this.prisma
      .$transaction(async (transaction) => {
        const item = await transaction.basketItem.findFirst({
          where: {
            id: basketItemId,
            basketId,
            basket: {
              status: BasketStatus.ACTIVE,
            },
          },
        });

        if (!item) {
          throw new NotFoundException({
            code: 'BASKET_ITEM_NOT_FOUND',
            message: 'The basket item was not found.',
          });
        }

        await transaction.basketItem.delete({
          where: { id: basketItemId },
        });

        return this.recalculateBasket(transaction, basketId);
      })
      .then((updatedBasket) => this.toBasketResponse(updatedBasket));
  }

  private validateRequest(request: AddBasketItemRequest): void {
    if (!request.menuProductId?.trim()) {
      throw new BadRequestException('menuProductId is required.');
    }
    this.validateQuantity(request.quantity);
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
      throw new UnprocessableEntityException({
        code: 'INVALID_QUANTITY',
        message: 'Quantity must be between 1 and 9.',
      });
    }
  }

  private async recalculateBasket(
    transaction: Pick<PrismaService, 'basket' | 'basketItem'>,
    basketId: string,
  ): Promise<BasketWithItems> {
    const totals = await transaction.basketItem.aggregate({
      where: { basketId },
      _sum: { lineTotal: true },
    });

    return transaction.basket.update({
      where: { id: basketId },
      data: {
        subtotalAmount: totals._sum.lineTotal ?? new Prisma.Decimal(0),
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private loadMenuProduct(
    menuProductId: string,
  ): Promise<ConfigurableMenuProduct | null> {
    return this.prisma.menuProduct.findFirst({
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
      include: configurableMenuProductInclude,
    });
  }

  private toBasketResponse(basket: BasketWithItems): BasketResponse {
    return {
      id: basket.id,
      sessionId: basket.sessionId,
      status: basket.status,
      subtotalAmount: basket.subtotalAmount.toString(),
      items: basket.items.map((item) => ({
        id: item.id,
        menuProductId: item.menuProductId,
        productId: item.productId,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        configuration: item.configurationSnapshot,
      })),
    };
  }
}
