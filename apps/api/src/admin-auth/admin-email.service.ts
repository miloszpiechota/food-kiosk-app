import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

interface AdminEmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface AdminEmailDelivery {
  channel: 'console' | 'resend';
  previewToken?: string;
  providerMessageId?: string;
}

interface ResendEmailResponse {
  id?: string;
  message?: string;
  name?: string;
}

@Injectable()
export class AdminEmailService {
  private readonly logger = new Logger(AdminEmailService.name);

  async sendInvite(input: {
    email: string;
    invitationUrl: string;
    previewToken: string;
  }): Promise<AdminEmailDelivery> {
    return this.send({
      to: input.email,
      subject: 'Food Kiosk admin invitation',
      text: [
        'You have been invited to the Food Kiosk admin panel.',
        `Set up your account: ${input.invitationUrl}`,
        'You will choose your password and set up two-factor authentication before the account is activated.',
      ].join('\n'),
      previewToken: input.previewToken,
    });
  }

  async sendPasswordReset(input: {
    email: string;
    resetUrl: string;
    previewToken: string;
  }): Promise<AdminEmailDelivery> {
    return this.send({
      to: input.email,
      subject: 'Food Kiosk admin password reset',
      text: [
        'A password reset was requested for your admin account.',
        `Reset your password: ${input.resetUrl}`,
        'If you did not request this, ignore this email.',
      ].join('\n'),
      previewToken: input.previewToken,
    });
  }

  private async send(
    message: AdminEmailMessage & { previewToken: string },
  ): Promise<AdminEmailDelivery> {
    const provider = this.getProvider();
    if (provider === 'console') {
      return this.sendConsole(message);
    }

    return this.sendResend(message);
  }

  private sendConsole(
    message: AdminEmailMessage & { previewToken: string },
  ): AdminEmailDelivery {
    this.logger.log(
      `Email queued via console provider: ${JSON.stringify({
        to: message.to,
        subject: message.subject,
        text: message.text,
      })}`,
    );

    return process.env.NODE_ENV === 'production'
      ? { channel: 'console' }
      : { channel: 'console', previewToken: message.previewToken };
  }

  private async sendResend(
    message: AdminEmailMessage,
  ): Promise<AdminEmailDelivery> {
    const apiKey = this.requireEnv('RESEND_API_KEY');
    const from = this.requireEnv('ADMIN_EMAIL_FROM');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    }).catch((error: unknown) => {
      throw this.emailProviderError(
        error instanceof Error
          ? error.message
          : 'Email provider request failed.',
      );
    });

    const body = (await response
      .json()
      .catch(() => ({}))) as ResendEmailResponse;
    if (!response.ok) {
      throw this.emailProviderError(
        body.message || body.name || 'Email provider rejected the message.',
      );
    }

    return { channel: 'resend', providerMessageId: body.id };
  }

  private getProvider(): 'console' | 'resend' {
    const provider = process.env.ADMIN_EMAIL_PROVIDER?.trim().toLowerCase();
    if (!provider) {
      if (process.env.NODE_ENV === 'production') {
        throw this.emailProviderError(
          'ADMIN_EMAIL_PROVIDER must be set to resend in production.',
        );
      }

      return 'console';
    }

    if (provider === 'console') {
      if (process.env.NODE_ENV === 'production') {
        throw this.emailProviderError(
          'Console email delivery is disabled in production.',
        );
      }

      return 'console';
    }

    if (provider === 'resend') {
      return 'resend';
    }

    throw this.emailProviderError('Unsupported admin email provider.');
  }

  private requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value || value.includes('change_me') || value.includes('your_')) {
      throw this.emailProviderError(`${name} must be configured.`);
    }

    return value;
  }

  private emailProviderError(message: string): HttpException {
    return new HttpException(
      {
        code: 'ADMIN_EMAIL_PROVIDER_UNAVAILABLE',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
