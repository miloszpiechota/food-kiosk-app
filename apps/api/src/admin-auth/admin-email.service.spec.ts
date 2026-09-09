import { HttpException } from '@nestjs/common';
import { AdminEmailService } from './admin-email.service';

const originalEnv = process.env;
const originalFetch = global.fetch;

describe('AdminEmailService', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses console delivery with preview tokens outside production', async () => {
    process.env.NODE_ENV = 'development';
    const service = new AdminEmailService();

    const delivery = await service.sendInvite({
      email: 'worker@example.com',
      invitationUrl: 'http://localhost:5173/admin-panel?inviteToken=token',
      previewToken: 'dev-token',
    });

    expect(delivery).toEqual({
      channel: 'console',
      previewToken: 'dev-token',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends admin emails through Resend when configured', async () => {
    process.env.ADMIN_EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.ADMIN_EMAIL_FROM = 'Food Kiosk <admin@example.com>';
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    } as Response);
    const service = new AdminEmailService();

    const delivery = await service.sendPasswordReset({
      email: 'worker@example.com',
      resetUrl: 'https://admin.example.com/admin-panel?resetToken=token',
      previewToken: 'reset-token',
    });

    const fetchMock = jest.mocked(global.fetch);
    const [url, requestInit] = fetchMock.mock.calls[0] ?? [];
    const body = typeof requestInit?.body === 'string' ? requestInit.body : '';

    expect(url).toBe('https://api.resend.com/emails');
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer re_test_key',
          'Content-Type': 'application/json',
        },
      }),
    );
    expect(body).toContain('"to":["worker@example.com"]');
    expect(delivery).toEqual({
      channel: 'resend',
      providerMessageId: 'email_123',
    });
  });

  it('rejects console delivery in production', async () => {
    process.env.NODE_ENV = 'production';
    const service = new AdminEmailService();

    await expect(
      service.sendInvite({
        email: 'worker@example.com',
        invitationUrl:
          'https://admin.example.com/admin-panel?inviteToken=token',
        previewToken: 'invite-token',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
