import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BasketStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../../../../node_modules/@prisma/client/.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderRequest, OrderResponse } from './kiosk-order.types';

type BasketForOrder = Prisma.BasketGetPayload<{
  include: {
    items: {
      include: {
        product: true;
        menuProduct: {
          include: {
            menuCategory: {
              include: {
                menu: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

@Injectable()
export class KioskOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    if (!request.basketId?.trim()) {
      throw new BadRequestException('basketId is required.');
    }

    return this.prisma
      .$transaction(async (transaction) => {
        const basket = await transaction.basket.findFirst({
          where: {
            id: request.basketId,
            status: BasketStatus.ACTIVE,
          },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
              include: {
                product: true,
                menuProduct: {
                  include: {
                    menuCategory: {
                      include: {
                        menu: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!basket) {
          throw new NotFoundException({
            code: 'BASKET_NOT_ACTIVE',
            message: 'The active basket was not found.',
          });
        }
        if (basket.items.length === 0) {
          throw new UnprocessableEntityException({
            code: 'BASKET_EMPTY',
            message: 'Add at least one item before creating an order.',
          });
        }

        const restaurantId = this.resolveRestaurantId(basket);
        const subtotalAmount = basket.items.reduce(
          (total, item) => total.add(item.lineTotal),
          new Prisma.Decimal(0),
        );
        const order = await transaction.order.create({
          data: {
            restaurant: {
              connect: { id: restaurantId },
            },
            orderNumber: this.createOrderNumber(),
            status: OrderStatus.NEW,
            paymentStatus: PaymentStatus.PENDING,
            subtotalAmount,
            totalAmount: subtotalAmount,
            items: {
              create: basket.items.map((item) => ({
                menuProduct: {
                  connect: { id: item.menuProductId },
                },
                product: {
                  connect: { id: item.productId },
                },
                productName: item.productNameSnapshot,
                productType: item.product.type,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                lineTotal: item.lineTotal,
                configurationSnapshot: this.toInputJson(
                  item.configurationSnapshot,
                ),
              })),
            },
          },
          include: {
            items: true,
          },
        });

        await transaction.basket.update({
          where: { id: basket.id },
          data: { status: BasketStatus.CHECKED_OUT },
        });

        return order;
      })
      .then((order) => this.toOrderResponse(order));
  }

  private resolveRestaurantId(basket: BasketForOrder): string {
    const restaurantIds = new Set(
      basket.items.map(
        (item) => item.menuProduct.menuCategory.menu.restaurantId,
      ),
    );

    if (restaurantIds.size !== 1) {
      throw new UnprocessableEntityException({
        code: 'BASKET_RESTAURANT_MISMATCH',
        message: 'The basket contains items from multiple restaurants.',
      });
    }

    const [restaurantId] = [...restaurantIds];
    if (!restaurantId) {
      throw new UnprocessableEntityException({
        code: 'BASKET_RESTAURANT_MISSING',
        message: 'The basket restaurant could not be resolved.',
      });
    }

    return restaurantId;
  }

  private createOrderNumber(): string {
    return `K-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;
  }

  private toInputJson(value: Prisma.JsonValue): Prisma.InputJsonValue {
    if (value === null) {
      throw new UnprocessableEntityException({
        code: 'BASKET_ITEM_CONFIGURATION_MISSING',
        message: 'A basket item is missing its configuration snapshot.',
      });
    }

    return value;
  }

  private toOrderResponse(order: OrderWithItems): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      items: order.items.map((item) => ({
        id: item.id,
        menuProductId: item.menuProductId,
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        configuration: item.configurationSnapshot,
      })),
    };
  }
}
