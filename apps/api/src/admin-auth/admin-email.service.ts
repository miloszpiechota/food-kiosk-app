import { Injectable, Logger } from '@nestjs/common';

interface AdminEmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface AdminEmailDelivery {
  channel: 'console';
  previewToken?: string;
}

@Injectable()
export class AdminEmailService {
  private readonly logger = new Logger(AdminEmailService.name);

  sendInvite(input: {
    email: string;
    invitationUrl: string;
    manualTotpSecret: string;
    previewToken: string;
  }): Promise<AdminEmailDelivery> {
    this.send({
      to: input.email,
      subject: 'Food Kiosk admin invitation',
      text: [
        'You have been invited to the Food Kiosk admin panel.',
        `Confirm your account: ${input.invitationUrl}`,
        `Manual 2FA setup key: ${input.manualTotpSecret}`,
      ].join('\n'),
    });

    return Promise.resolve(this.delivery(input.previewToken));
  }

  sendPasswordReset(input: {
    email: string;
    resetUrl: string;
    previewToken: string;
  }): Promise<AdminEmailDelivery> {
    this.send({
      to: input.email,
      subject: 'Food Kiosk admin password reset',
      text: [
        'A password reset was requested for your admin account.',
        `Reset your password: ${input.resetUrl}`,
        'If you did not request this, ignore this email.',
      ].join('\n'),
    });

    return Promise.resolve(this.delivery(input.previewToken));
  }

  private send(message: AdminEmailMessage): void {
    this.logger.log(
      `Email queued via console provider: ${JSON.stringify(message)}`,
    );
  }

  private delivery(previewToken: string): AdminEmailDelivery {
    if (process.env.NODE_ENV === 'production') {
      return { channel: 'console' };
    }

    return { channel: 'console', previewToken };
  }
}
