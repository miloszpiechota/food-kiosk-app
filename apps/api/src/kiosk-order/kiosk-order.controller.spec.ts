import { Test, TestingModule } from '@nestjs/testing';
import { KioskOrderController } from './kiosk-order.controller';
import { KioskOrderService } from './kiosk-order.service';

describe('KioskOrderController', () => {
  let controller: KioskOrderController;
  let service: jest.Mocked<Pick<KioskOrderService, 'createOrder' | 'getOrder'>>;

  beforeEach(async () => {
    service = {
      createOrder: jest.fn(),
      getOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskOrderController],
      providers: [
        {
          provide: KioskOrderService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(KioskOrderController);
  });

  it('creates an order snapshot from a basket', async () => {
    const response = {
      id: 'order-1',
      orderNumber: 'K-20260702-ABC123',
      status: 'NEW',
      paymentStatus: 'PENDING',
      subtotalAmount: '53',
      totalAmount: '53',
      items: [],
    };
    service.createOrder.mockResolvedValue(response);

    await expect(
      controller.createOrder({ basketId: 'basket-1' }),
    ).resolves.toBe(response);
    expect(service.createOrder).toHaveBeenCalledWith({ basketId: 'basket-1' });
  });

  it('gets an order by id', async () => {
    const response = {
      id: 'order-1',
      orderNumber: 'K-20260702-ABC123',
      status: 'NEW',
      paymentStatus: 'PAID',
      subtotalAmount: '53',
      totalAmount: '53',
      items: [],
    };
    service.getOrder.mockResolvedValue(response);

    await expect(controller.getOrder('order-1')).resolves.toBe(response);
    expect(service.getOrder).toHaveBeenCalledWith('order-1');
  });
});
