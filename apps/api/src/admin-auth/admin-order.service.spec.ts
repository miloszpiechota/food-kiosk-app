/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AdminRole,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import { AdminOrderService } from './admin-order.service';

function createPrismaMock() {
  return {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createService(prisma: ReturnType<typeof createPrismaMock>) {
  return new AdminOrderService(prisma as unknown as PrismaService);
}

function createSession(input?: {
  role?: AdminRole;
  restaurantIds?: string[];
}): AdminAuthenticatedSession {
  return {
    sessionId: 'session-1',
    tokenId: '11111111-1111-4111-8111-111111111111',
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: input?.role ?? AdminRole.SUPER_ADMIN,
      restaurantIds: input?.restaurantIds ?? [],
    },
  };
}

function money(value: string) {
  return { toString: () => value };
}

function createOrderRecord(input?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    restaurantId: '22222222-2222-4222-8222-222222222222',
    orderNumber: 'K-20260730-ABC123',
    status: input?.status ?? OrderStatus.NEW,
    paymentStatus: input?.paymentStatus ?? PaymentStatus.PAID,
    subtotalAmount: money('45.50'),
    totalAmount: money('45.50'),
    createdAt: new Date('2026-07-30T10:00:00.000Z'),
    updatedAt: new Date('2026-07-30T10:05:00.000Z'),
    restaurant: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Central Burger House',
    },
    payment: {
      id: 'payment-1',
      provider: PaymentProvider.STRIPE,
      providerSessionId: 'cs_test_123',
      providerPaymentIntentId: 'pi_test_123',
      status: input?.paymentStatus ?? PaymentStatus.PAID,
      amount: money('45.50'),
      currency: 'PLN',
      createdAt: new Date('2026-07-30T10:01:00.000Z'),
      updatedAt: new Date('2026-07-30T10:02:00.000Z'),
    },
    _count: {
      items: 1,
    },
    items: [
      {
        id: 'item-1',
        menuProductId: '33333333-3333-4333-8333-333333333333',
        productId: '44444444-4444-4444-8444-444444444444',
        productName: 'Classic Burger Meal',
        productType: ProductType.MEAL,
        unitPrice: money('45.50'),
        quantity: 1,
        lineTotal: money('45.50'),
        configurationSnapshot: {
          groups: [{ name: 'Side', optionName: 'Fries' }],
        },
      },
    ],
  };
}

describe('AdminOrderService', () => {
  it('lists orders with restaurant, status, payment, date, and search filters', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);
    prisma.order.findMany.mockResolvedValue([createOrderRecord()]);

    const response = await service.listOrders(createSession(), {
      restaurantId: '22222222-2222-4222-8222-222222222222',
      orderStatus: OrderStatus.NEW,
      paymentStatus: PaymentStatus.PAID,
      dateFrom: '2026-07-30T00:00:00.000Z',
      dateTo: '2026-07-31T00:00:00.000Z',
      search: 'burger',
    });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { restaurantId: '22222222-2222-4222-8222-222222222222' },
            { status: OrderStatus.NEW },
            { paymentStatus: PaymentStatus.PAID },
          ]),
        }),
      }),
    );
    expect(response.orders[0]).toEqual(
      expect.objectContaining({
        orderNumber: 'K-20260730-ABC123',
        restaurantName: 'Central Burger House',
        itemCount: 1,
      }),
    );
  });

  it('rejects restaurant filters outside admin access', async () => {
    const service = createService(createPrismaMock());

    await expect(
      service.listOrders(
        createSession({
          role: AdminRole.ADMIN,
          restaurantIds: ['22222222-2222-4222-8222-222222222222'],
        }),
        {
          restaurantId: '55555555-5555-4555-8555-555555555555',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns full order detail with payment and item snapshots', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);
    prisma.order.findFirst.mockResolvedValue(createOrderRecord());

    const response = await service.getOrder(
      createSession(),
      '11111111-1111-4111-8111-111111111111',
    );

    expect(response.order.payment?.providerSessionId).toBe('cs_test_123');
    expect(response.order.items[0].configurationSnapshot).toEqual({
      groups: [{ name: 'Side', optionName: 'Fries' }],
    });
  });

  it('updates order status only through allowed transitions', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);
    prisma.order.findFirst.mockResolvedValue(
      createOrderRecord({ status: OrderStatus.NEW }),
    );
    prisma.order.update.mockResolvedValue(
      createOrderRecord({ status: OrderStatus.IN_PROGRESS }),
    );

    const response = await service.updateOrderStatus(
      createSession(),
      '11111111-1111-4111-8111-111111111111',
      { status: OrderStatus.IN_PROGRESS },
    );

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: OrderStatus.IN_PROGRESS },
      }),
    );
    expect(response.order.orderStatus).toBe(OrderStatus.IN_PROGRESS);
  });

  it('rejects invalid order status transitions', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);
    prisma.order.findFirst.mockResolvedValue(
      createOrderRecord({ status: OrderStatus.NEW }),
    );

    await expect(
      service.updateOrderStatus(
        createSession(),
        '11111111-1111-4111-8111-111111111111',
        { status: OrderStatus.COMPLETED },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
