import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import type {
  AdminOrderDetail,
  AdminOrderDetailResponse,
  AdminOrderListQuery,
  AdminOrderListResponse,
  AdminOrderSummary,
  UpdateAdminOrderStatusRequest,
  UpdateAdminOrderStatusResponse,
} from './admin-order.types';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

type AdminOrderSummaryRecord = Prisma.OrderGetPayload<{
  include: {
    restaurant: true;
    payment: true;
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

type AdminOrderDetailRecord = Prisma.OrderGetPayload<{
  include: {
    restaurant: true;
    payment: true;
    items: true;
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(
    actor: AdminAuthenticatedSession,
    query: AdminOrderListQuery,
  ): Promise<AdminOrderListResponse> {
    const where = this.buildOrderWhere(actor, query);
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
      include: this.orderSummaryInclude(),
    });

    return {
      orders: orders.map((order) => this.toOrderSummary(order)),
    };
  }

  async getOrder(
    actor: AdminAuthenticatedSession,
    orderId: string,
  ): Promise<AdminOrderDetailResponse> {
    this.validateUuid(
      orderId,
      'ADMIN_ORDER_ID_INVALID',
      'Order id is invalid.',
    );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...this.accessibleOrderWhere(actor),
      },
      include: this.orderDetailInclude(),
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ADMIN_ORDER_NOT_FOUND',
        message: 'The order was not found.',
      });
    }

    return { order: this.toOrderDetail(order) };
  }

  async updateOrderStatus(
    actor: AdminAuthenticatedSession,
    orderId: string,
    request: UpdateAdminOrderStatusRequest,
  ): Promise<UpdateAdminOrderStatusResponse> {
    this.validateUuid(
      orderId,
      'ADMIN_ORDER_ID_INVALID',
      'Order id is invalid.',
    );
    const nextStatus = this.validateOrderStatus(request.status);
    const existing = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...this.accessibleOrderWhere(actor),
      },
      include: this.orderDetailInclude(),
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'ADMIN_ORDER_NOT_FOUND',
        message: 'The order was not found.',
      });
    }

    if (existing.status === nextStatus) {
      return { order: this.toOrderDetail(existing) };
    }

    if (!allowedTransitions[existing.status].includes(nextStatus)) {
      throw new BadRequestException({
        code: 'ADMIN_ORDER_STATUS_TRANSITION_INVALID',
        message: `Order status cannot change from ${existing.status} to ${nextStatus}.`,
      });
    }

    if (
      nextStatus === OrderStatus.COMPLETED &&
      existing.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException({
        code: 'ADMIN_ORDER_PAYMENT_NOT_PAID',
        message: 'Only paid orders can be marked as completed.',
      });
    }

    const order = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status: nextStatus },
      include: this.orderDetailInclude(),
    });

    return { order: this.toOrderDetail(order) };
  }

  private buildOrderWhere(
    actor: AdminAuthenticatedSession,
    query: AdminOrderListQuery,
  ): Prisma.OrderWhereInput {
    const filters: Prisma.OrderWhereInput[] = [
      this.accessibleOrderWhere(actor),
    ];
    const restaurantId = query.restaurantId?.trim();
    if (restaurantId) {
      this.validateUuid(
        restaurantId,
        'ADMIN_RESTAURANT_ID_INVALID',
        'Restaurant id is invalid.',
      );
      this.assertRestaurantAccess(actor, restaurantId);
      filters.push({ restaurantId });
    }

    const orderStatus = this.optionalOrderStatus(query.orderStatus);
    if (orderStatus) {
      filters.push({ status: orderStatus });
    }

    const paymentStatus = this.optionalPaymentStatus(query.paymentStatus);
    if (paymentStatus) {
      filters.push({ paymentStatus });
    }

    const dateFrom = this.optionalDate(query.dateFrom, 'dateFrom');
    if (dateFrom) {
      filters.push({ createdAt: { gte: dateFrom } });
    }

    const dateTo = this.optionalDate(query.dateTo, 'dateTo');
    if (dateTo) {
      filters.push({ createdAt: { lte: dateTo } });
    }

    const search = query.search?.trim();
    if (search) {
      if (search.length > 80) {
        throw new BadRequestException({
          code: 'ADMIN_ORDER_SEARCH_TOO_LONG',
          message: 'Search must be 80 characters or fewer.',
        });
      }
      filters.push({
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: {
                productName: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    return { AND: filters };
  }

  private accessibleOrderWhere(
    actor: AdminAuthenticatedSession,
  ): Prisma.OrderWhereInput {
    if (actor.user.role === AdminRole.SUPER_ADMIN) {
      return {};
    }

    return { restaurantId: { in: actor.user.restaurantIds } };
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

  private validateUuid(value: string, code: string, message: string): void {
    if (!uuidPattern.test(value.trim())) {
      throw new BadRequestException({ code, message });
    }
  }

  private validateOrderStatus(value: unknown): OrderStatus {
    if (
      typeof value === 'string' &&
      Object.values(OrderStatus).includes(value as OrderStatus)
    ) {
      return value as OrderStatus;
    }

    throw new BadRequestException({
      code: 'ADMIN_ORDER_STATUS_INVALID',
      message: 'Order status is invalid.',
    });
  }

  private optionalOrderStatus(value: unknown): OrderStatus | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return this.validateOrderStatus(value);
  }

  private optionalPaymentStatus(value: unknown): PaymentStatus | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (
      typeof value === 'string' &&
      Object.values(PaymentStatus).includes(value as PaymentStatus)
    ) {
      return value as PaymentStatus;
    }

    throw new BadRequestException({
      code: 'ADMIN_PAYMENT_STATUS_INVALID',
      message: 'Payment status is invalid.',
    });
  }

  private optionalDate(value: unknown, fieldName: string): Date | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value !== 'string') {
      throw new BadRequestException({
        code: 'ADMIN_ORDER_DATE_INVALID',
        message: `${fieldName} must be a valid date.`,
      });
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException({
        code: 'ADMIN_ORDER_DATE_INVALID',
        message: `${fieldName} must be a valid date.`,
      });
    }

    return date;
  }

  private orderSummaryInclude() {
    return {
      restaurant: true,
      payment: true,
      _count: {
        select: {
          items: true,
        },
      },
    } satisfies Prisma.OrderInclude;
  }

  private orderDetailInclude() {
    return {
      ...this.orderSummaryInclude(),
      items: {
        orderBy: { id: 'asc' },
      },
    } satisfies Prisma.OrderInclude;
  }

  private toOrderSummary(order: AdminOrderSummaryRecord): AdminOrderSummary {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant.name,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      itemCount: order._count.items,
      payment: order.payment
        ? {
            id: order.payment.id,
            provider: order.payment.provider,
            providerSessionId: order.payment.providerSessionId,
            providerPaymentIntentId: order.payment.providerPaymentIntentId,
            status: order.payment.status,
            amount: order.payment.amount.toString(),
            currency: order.payment.currency,
            createdAt: order.payment.createdAt.toISOString(),
            updatedAt: order.payment.updatedAt.toISOString(),
          }
        : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toOrderDetail(order: AdminOrderDetailRecord): AdminOrderDetail {
    return {
      ...this.toOrderSummary(order),
      items: order.items.map((item) => ({
        id: item.id,
        menuProductId: item.menuProductId,
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        unitPrice: item.unitPrice.toString(),
        quantity: item.quantity,
        lineTotal: item.lineTotal.toString(),
        configurationSnapshot: item.configurationSnapshot,
      })),
    };
  }
}
