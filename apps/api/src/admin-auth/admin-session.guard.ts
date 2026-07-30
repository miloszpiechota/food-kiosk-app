import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import type { AdminRequest } from './current-admin.decorator';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const session = await this.adminAuthService.getSession(
      this.extractToken(request),
    );

    if (!session) {
      throw new UnauthorizedException({
        code: 'ADMIN_SESSION_INVALID',
        message: 'A valid admin session is required.',
      });
    }

    request.adminSession = session;
    return true;
  }

  private extractToken(request: AdminRequest): string | undefined {
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string') {
      const [scheme, token] = authorization.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    const cookie = request.headers.cookie;
    if (typeof cookie !== 'string') {
      return undefined;
    }

    const cookies = new Map(
      cookie.split(';').map((part) => {
        const [name, ...valueParts] = part.trim().split('=');
        return [name, decodeURIComponent(valueParts.join('='))];
      }),
    );

    return cookies.get('admin_session');
  }
}
