import { Test, TestingModule } from '@nestjs/testing';
import { KioskBasketController } from './kiosk-basket.controller';
import { KioskBasketService } from './kiosk-basket.service';

describe('KioskBasketController', () => {
  let controller: KioskBasketController;
  let service: jest.Mocked<
    Pick<KioskBasketService, 'createBasket' | 'addItem'>
  >;

  beforeEach(async () => {
    service = {
      createBasket: jest.fn(),
      addItem: jest.fn(),
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
});
