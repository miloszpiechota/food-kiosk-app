import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BasketStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KioskOrderService } from './kiosk-order.service';

const decimal = (value: string) => new Prisma.Decimal(value);

interface TransactionMock {
  basket: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  order: {
    create: jest.Mock;
  };
}

function createTransactionMock(): TransactionMock {
  return {
    basket: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };
}

function createPrismaMock(transaction = createTransactionMock()) {
  return {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
}

function createBasketRecord(input?: { items?: unknown[] }) {
  return {
    id: 'basket-1',
    sessionId: 'session-1',
    status: BasketStatus.ACTIVE,
    items: input?.items ?? [
      {
        id: 'basket-item-1',
        menuProductId: 'menu-product-1',
        productId: 'product-1',
        productNameSnapshot: 'Burger Meal',
        quantity: 2,
        unitPrice: decimal('26.50'),
        lineTotal: decimal('53.00'),
        configurationSnapshot: {
          version: 1,
          productType: ProductType.MEAL,
        },
        product: {
          id: 'product-1',
          type: ProductType.MEAL,
        },
        menuProduct: {
          menuCategory: {
            menu: {
              restaurantId: 'restaurant-1',
            },
          },
        },
      },
    ],
  };
}

function createOrderRecord() {
  return {
    id: 'order-1',
    restaurantId: 'restaurant-1',
    orderNumber: 'K-20260702-ABC123',
    status: OrderStatus.NEW,
    paymentStatus: PaymentStatus.PENDING,
    subtotalAmount: decimal('53.00'),
    totalAmount: decimal('53.00'),
    items: [
      {
        id: 'order-item-1',
        menuProductId: 'menu-product-1',
        productId: 'product-1',
        productName: 'Burger Meal',
        productType: ProductType.MEAL,
        quantity: 2,
        unitPrice: decimal('26.50'),
        lineTotal: decimal('53.00'),
        configurationSnapshot: {
          version: 1,
          productType: ProductType.MEAL,
        },
      },
    ],
  };
}

function createService() {
  const transaction = createTransactionMock();
  const prisma = createPrismaMock(transaction);

  return {
    prisma,
    service: new KioskOrderService(prisma as unknown as PrismaService),
    transaction,
  };
}

function getSingleMockArg<T>(mock: jest.Mock): T {
  expect(mock).toHaveBeenCalledTimes(1);
  const calls = mock.mock.calls as unknown as [[T]];
  return calls[0][0];
}

describe('KioskOrderService', () => {
  it('creates an immutable order snapshot from the active basket', async () => {
    const { service, transaction } = createService();
    transaction.basket.findFirst.mockResolvedValue(createBasketRecord());
    transaction.order.create.mockResolvedValue(createOrderRecord());
    transaction.basket.update.mockResolvedValue({
      id: 'basket-1',
      status: BasketStatus.CHECKED_OUT,
    });

    const response = await service.createOrder({ basketId: 'basket-1' });
    const orderCreateCall = getSingleMockArg<{
      data: {
        items: {
          create: Array<{
            configurationSnapshot: unknown;
            lineTotal: Prisma.Decimal;
            menuProduct: { connect: { id: string } };
            product: { connect: { id: string } };
            productName: string;
            productType: ProductType;
            quantity: number;
            unitPrice: Prisma.Decimal;
          }>;
        };
        paymentStatus: PaymentStatus;
        restaurant: { connect: { id: string } };
        status: OrderStatus;
        subtotalAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
      };
      include: { items: true };
    }>(transaction.order.create);

    expect(transaction.basket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'basket-1',
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
    expect(orderCreateCall.data.restaurant.connect.id).toBe('restaurant-1');
    expect(orderCreateCall.data.status).toBe(OrderStatus.NEW);
    expect(orderCreateCall.data.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(orderCreateCall.data.subtotalAmount.toString()).toBe('53');
    expect(orderCreateCall.data.totalAmount.toString()).toBe('53');
    expect(orderCreateCall.data.items.create[0]).toMatchObject({
      menuProduct: { connect: { id: 'menu-product-1' } },
      product: { connect: { id: 'product-1' } },
      productName: 'Burger Meal',
      productType: ProductType.MEAL,
      quantity: 2,
    });
    expect(orderCreateCall.data.items.create[0].unitPrice.toString()).toBe(
      '26.5',
    );
    expect(orderCreateCall.data.items.create[0].lineTotal.toString()).toBe(
      '53',
    );
    expect(transaction.basket.update).toHaveBeenCalledWith({
      where: { id: 'basket-1' },
      data: { status: BasketStatus.CHECKED_OUT },
    });
    expect(response).toMatchObject({
      id: 'order-1',
      orderNumber: 'K-20260702-ABC123',
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
      subtotalAmount: '53',
      totalAmount: '53',
      items: [
        {
          productName: 'Burger Meal',
          quantity: 2,
          unitPrice: '26.5',
          lineTotal: '53',
        },
      ],
    });
  });

  it('gets an order snapshot with the latest payment status', async () => {
    const { prisma, service } = createService();
    const order = {
      ...createOrderRecord(),
      paymentStatus: PaymentStatus.PAID,
    };
    prisma.order.findUnique.mockResolvedValue(order);

    const response = await service.getOrder('order-1');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      include: {
        items: true,
      },
    });
    expect(response).toMatchObject({
      id: 'order-1',
      orderNumber: 'K-20260702-ABC123',
      paymentStatus: PaymentStatus.PAID,
      totalAmount: '53',
    });
  });

  it('rejects a missing order lookup', async () => {
    const { prisma, service } = createService();
    prisma.order.findUnique.mockResolvedValue(null);

    let error: unknown;
    try {
      await service.getOrder('order-1');
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
  });

  it('rejects a missing or checked-out basket', async () => {
    const { service, transaction } = createService();
    transaction.basket.findFirst.mockResolvedValue(null);

    let error: unknown;
    try {
      await service.createOrder({ basketId: 'basket-1' });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: 'BASKET_NOT_ACTIVE',
    });
    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(transaction.basket.update).not.toHaveBeenCalled();
  });

  it('rejects an empty active basket', async () => {
    const { service, transaction } = createService();
    transaction.basket.findFirst.mockResolvedValue(
      createBasketRecord({ items: [] }),
    );

    let error: unknown;
    try {
      await service.createOrder({ basketId: 'basket-1' });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect((error as UnprocessableEntityException).getResponse()).toMatchObject(
      {
        code: 'BASKET_EMPTY',
      },
    );
    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(transaction.basket.update).not.toHaveBeenCalled();
  });
});
