import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('X-User-Id header is required');
    }

    request.user = { userId };
    return true;
  }
}
