import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BasketStatus,
  Prisma,
} from '../../../../node_modules/@prisma/client/.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AddBasketItemRequest } from './kiosk-basket.types';
import { KioskBasketService } from './kiosk-basket.service';
import { MealConfigurationService } from './meal-configuration.service';

const decimal = (value: string) => new Prisma.Decimal(value);

interface TransactionMock {
  basket: {
    update: jest.Mock;
  };
  basketItem: {
    aggregate: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
}

function createTransactionMock(): TransactionMock {
  return {
    basket: {
      update: jest.fn(),
    },
    basketItem: {
      aggregate: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createPrismaMock(transaction = createTransactionMock()) {
  return {
    basket: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    menuProduct: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
}

function createBasketRecord(input?: {
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }>;
  subtotalAmount?: string;
}) {
  return {
    id: 'basket-1',
    sessionId: 'session-1',
    status: BasketStatus.ACTIVE,
    subtotalAmount: decimal(input?.subtotalAmount ?? '0.00'),
    items: (input?.items ?? []).map((item) => ({
      id: item.id,
      menuProductId: 'menu-product-1',
      productId: 'product-1',
      productNameSnapshot: 'Burger Meal',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      configurationSnapshot: { version: 1 },
    })),
  };
}

function createService(input?: {
  transaction?: TransactionMock;
  unitPrice?: string;
}) {
  const transaction = input?.transaction ?? createTransactionMock();
  const prisma = createPrismaMock(transaction);
  const menuProduct = {
    id: 'menu-product-1',
    product: {
      id: 'product-1',
      name: 'Burger Meal',
    },
  };
  const configuration = {
    fingerprint: 'configuration-fingerprint',
    snapshot: { version: 1 },
    unitPrice: decimal(input?.unitPrice ?? '26.50'),
  };
  const mealConfiguration = {
    evaluate: jest.fn().mockReturnValue(configuration),
  };

  prisma.basket.findFirst.mockResolvedValue(createBasketRecord());
  prisma.menuProduct.findFirst.mockResolvedValue(menuProduct);

  return {
    configuration,
    mealConfiguration,
    menuProduct,
    prisma,
    service: new KioskBasketService(
      prisma as unknown as PrismaService,
      mealConfiguration as unknown as MealConfigurationService,
    ),
    transaction,
  };
}

function createAddRequest(input?: Partial<AddBasketItemRequest>) {
  return {
    menuProductId: 'menu-product-1',
    quantity: 1,
    ...input,
  };
}

function getSingleMockArg<T>(mock: jest.Mock): T {
  expect(mock).toHaveBeenCalledTimes(1);
  const calls = mock.mock.calls as unknown as [[T]];
  return calls[0][0];
}

describe('KioskBasketService', () => {
  it('creates a basket with a provided session id', async () => {
    const { prisma, service } = createService();
    prisma.basket.create.mockResolvedValue(createBasketRecord());

    await expect(
      service.createBasket({ sessionId: ' session-1 ' }),
    ).resolves.toMatchObject({
      id: 'basket-1',
      sessionId: 'session-1',
      subtotalAmount: '0',
      items: [],
    });
    expect(prisma.basket.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        status: BasketStatus.ACTIVE,
      },
      include: {
        items: true,
      },
    });
  });

  it('gets an active basket with ordered items', async () => {
    const { prisma, service } = createService();
    prisma.basket.findFirst.mockResolvedValue(
      createBasketRecord({
        subtotalAmount: '26.50',
        items: [
          {
            id: 'basket-item-1',
            quantity: 1,
            unitPrice: decimal('26.50'),
            lineTotal: decimal('26.50'),
          },
        ],
      }),
    );

    await expect(service.getBasket('basket-1')).resolves.toMatchObject({
      id: 'basket-1',
      subtotalAmount: '26.5',
      items: [
        {
          id: 'basket-item-1',
          quantity: 1,
        },
      ],
    });
    expect(prisma.basket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'basket-1',
        status: BasketStatus.ACTIVE,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  it('merges identical configurations and recalculates the basket subtotal', async () => {
    const {
      configuration,
      mealConfiguration,
      menuProduct,
      service,
      transaction,
    } = createService();
    const request = createAddRequest({ quantity: 1 });
    transaction.basketItem.findUnique.mockResolvedValue({
      id: 'basket-item-1',
      quantity: 2,
    });
    transaction.basketItem.aggregate.mockResolvedValue({
      _sum: { lineTotal: decimal('79.50') },
    });
    transaction.basket.update.mockResolvedValue(
      createBasketRecord({
        subtotalAmount: '79.50',
        items: [
          {
            id: 'basket-item-1',
            quantity: 3,
            unitPrice: decimal('26.50'),
            lineTotal: decimal('79.50'),
          },
        ],
      }),
    );

    const response = await service.addItem('basket-1', request);
    const updateCall = getSingleMockArg<{
      data: {
        configurationSnapshot: unknown;
        lineTotal: Prisma.Decimal;
        quantity: number;
        unitPrice: Prisma.Decimal;
      };
    }>(transaction.basketItem.update);

    expect(mealConfiguration.evaluate).toHaveBeenCalledWith(
      menuProduct,
      request,
    );
    expect(transaction.basketItem.create).not.toHaveBeenCalled();
    expect(updateCall.data.quantity).toBe(3);
    expect(updateCall.data.unitPrice.toString()).toBe('26.5');
    expect(updateCall.data.lineTotal.toString()).toBe('79.5');
    expect(updateCall.data.configurationSnapshot).toBe(configuration.snapshot);
    expect(response).toMatchObject({
      subtotalAmount: '79.5',
      items: [
        {
          quantity: 3,
          unitPrice: '26.5',
          lineTotal: '79.5',
          configuration: configuration.snapshot,
        },
      ],
    });
  });

  it('creates a new basket line when no matching configuration exists', async () => {
    const { configuration, service, transaction } = createService();
    transaction.basketItem.findUnique.mockResolvedValue(null);
    transaction.basketItem.aggregate.mockResolvedValue({
      _sum: { lineTotal: decimal('53.00') },
    });
    transaction.basket.update.mockResolvedValue(
      createBasketRecord({
        subtotalAmount: '53.00',
        items: [
          {
            id: 'basket-item-1',
            quantity: 2,
            unitPrice: decimal('26.50'),
            lineTotal: decimal('53.00'),
          },
        ],
      }),
    );

    const response = await service.addItem(
      'basket-1',
      createAddRequest({ quantity: 2 }),
    );
    const createCall = getSingleMockArg<{
      data: {
        configurationFingerprint: string;
        lineTotal: Prisma.Decimal;
        quantity: number;
        unitPrice: Prisma.Decimal;
      };
    }>(transaction.basketItem.create);

    expect(transaction.basketItem.update).not.toHaveBeenCalled();
    expect(createCall.data.quantity).toBe(2);
    expect(createCall.data.unitPrice.toString()).toBe('26.5');
    expect(createCall.data.lineTotal.toString()).toBe('53');
    expect(createCall.data.configurationFingerprint).toBe(
      configuration.fingerprint,
    );
    expect(response.subtotalAmount).toBe('53');
  });

  it('updates an item quantity and recalculates the basket subtotal', async () => {
    const { service, transaction } = createService();
    transaction.basketItem.findFirst.mockResolvedValue({
      id: 'basket-item-1',
      unitPrice: decimal('26.50'),
    });
    transaction.basketItem.aggregate.mockResolvedValue({
      _sum: { lineTotal: decimal('53.00') },
    });
    transaction.basket.update.mockResolvedValue(
      createBasketRecord({
        subtotalAmount: '53.00',
        items: [
          {
            id: 'basket-item-1',
            quantity: 2,
            unitPrice: decimal('26.50'),
            lineTotal: decimal('53.00'),
          },
        ],
      }),
    );

    const response = await service.updateItemQuantity('basket-1', 'item-1', {
      quantity: 2,
    });
    const updateCall = getSingleMockArg<{
      data: {
        lineTotal: Prisma.Decimal;
        quantity: number;
      };
    }>(transaction.basketItem.update);

    expect(updateCall.data.quantity).toBe(2);
    expect(updateCall.data.lineTotal.toString()).toBe('53');
    expect(response.subtotalAmount).toBe('53');
  });

  it('removes an item and recalculates the basket subtotal', async () => {
    const { service, transaction } = createService();
    transaction.basketItem.findFirst.mockResolvedValue({
      id: 'basket-item-1',
    });
    transaction.basketItem.aggregate.mockResolvedValue({
      _sum: { lineTotal: null },
    });
    transaction.basket.update.mockResolvedValue(createBasketRecord());

    const response = await service.removeItem('basket-1', 'basket-item-1');

    expect(transaction.basketItem.delete).toHaveBeenCalledWith({
      where: { id: 'basket-item-1' },
    });
    expect(response).toMatchObject({
      subtotalAmount: '0',
      items: [],
    });
  });

  it('rejects missing or inactive baskets before writing an item', async () => {
    const { prisma, service, transaction } = createService();
    prisma.basket.findFirst.mockResolvedValue(null);

    let error: unknown;
    try {
      await service.addItem('missing-basket', createAddRequest());
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: 'BASKET_NOT_ACTIVE',
    });
    expect(transaction.basketItem.create).not.toHaveBeenCalled();
    expect(transaction.basketItem.update).not.toHaveBeenCalled();
  });

  it('rejects invalid quantities before reading basket state', async () => {
    const { prisma, service } = createService();

    let error: unknown;
    try {
      await service.addItem('basket-1', createAddRequest({ quantity: 10 }));
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect((error as UnprocessableEntityException).getResponse()).toMatchObject(
      {
        code: 'INVALID_QUANTITY',
      },
    );
    expect(prisma.basket.findFirst).not.toHaveBeenCalled();
    expect(prisma.menuProduct.findFirst).not.toHaveBeenCalled();
  });
});
