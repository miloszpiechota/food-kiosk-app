import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminAuthenticatedSession } from './admin-auth.types';

export type AdminRequest = Request & {
  adminSession?: AdminAuthenticatedSession;
};

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminAuthenticatedSession => {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!request.adminSession) {
      throw new Error('Admin session was not attached to the request.');
    }

    return request.adminSession;
  },
);
