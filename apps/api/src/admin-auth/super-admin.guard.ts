import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import type { AdminRequest } from './current-admin.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (request.adminSession?.user.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        code: 'ADMIN_SUPER_ADMIN_REQUIRED',
        message: 'Only a super admin can perform this action.',
      });
    }

    return true;
  }
}
