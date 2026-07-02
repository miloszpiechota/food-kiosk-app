import { Test, TestingModule } from '@nestjs/testing';
import { KioskBasketController } from './kiosk-basket.controller';
import { KioskBasketService } from './kiosk-basket.service';

describe('KioskBasketController', () => {
  let controller: KioskBasketController;
  let service: jest.Mocked<
    Pick<
      KioskBasketService,
      | 'addItem'
      | 'createBasket'
      | 'getBasket'
      | 'removeItem'
      | 'updateItemQuantity'
    >
  >;

  beforeEach(async () => {
    service = {
      addItem: jest.fn(),
      createBasket: jest.fn(),
      getBasket: jest.fn(),
      removeItem: jest.fn(),
      updateItemQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskBasketController],
      providers: [
        {
          provide: KioskBasketService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(KioskBasketController);
  });

  it('creates a basket', async () => {
    const response = {
      id: 'basket-1',
      sessionId: 'session-1',
      status: 'ACTIVE',
      subtotalAmount: '0',
      items: [],
    };
    service.createBasket.mockResolvedValue(response);

    await expect(
      controller.createBasket({ sessionId: 'session-1' }),
    ).resolves.toBe(response);
  });

  it('adds a configured item to a basket', async () => {
    const request = {
      menuProductId: 'menu-product-1',
      quantity: 1,
      groupSelections: [],
    };
    const response = {
      id: 'basket-1',
      sessionId: 'session-1',
      status: 'ACTIVE',
      subtotalAmount: '20',
      items: [],
    };
    service.addItem.mockResolvedValue(response);

    await expect(controller.addItem('basket-1', request)).resolves.toBe(
      response,
    );
    expect(service.addItem).toHaveBeenCalledWith('basket-1', request);
  });

  it('gets an active basket', async () => {
    const response = {
      id: 'basket-1',
      sessionId: 'session-1',
      status: 'ACTIVE',
      subtotalAmount: '20',
      items: [],
    };
    service.getBasket.mockResolvedValue(response);

    await expect(controller.getBasket('basket-1')).resolves.toBe(response);
    expect(service.getBasket).toHaveBeenCalledWith('basket-1');
  });

  it('updates basket item quantity', async () => {
    const response = {
      id: 'basket-1',
      sessionId: 'session-1',
      status: 'ACTIVE',
      subtotalAmount: '40',
      items: [],
    };
    service.updateItemQuantity.mockResolvedValue(response);

    await expect(
      controller.updateItemQuantity('basket-1', 'item-1', { quantity: 2 }),
    ).resolves.toBe(response);
    expect(service.updateItemQuantity).toHaveBeenCalledWith(
      'basket-1',
      'item-1',
      { quantity: 2 },
    );
  });

  it('removes a basket item', async () => {
    const response = {
      id: 'basket-1',
      sessionId: 'session-1',
      status: 'ACTIVE',
      subtotalAmount: '0',
      items: [],
    };
    service.removeItem.mockResolvedValue(response);

    await expect(controller.removeItem('basket-1', 'item-1')).resolves.toBe(
      response,
    );
    expect(service.removeItem).toHaveBeenCalledWith('basket-1', 'item-1');
  });
});
