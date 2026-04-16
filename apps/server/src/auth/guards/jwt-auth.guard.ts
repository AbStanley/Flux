import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // WebSocket auth is handled by Socket.IO middleware at connection time
    if (context.getType() === 'ws') return true;

    // Try JWT auth first
    try {
      const result = await (super.canActivate(context) as Promise<boolean>);
      if (result) return true;
    } catch {
      // JWT failed — check if localhost (dev mode fallback)
    }

    // Allow localhost in development as fallback when JWT fails
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      connection?: { remoteAddress?: string };
    }>();
    const clientIp = request.ip || request.connection?.remoteAddress || '';
    const isLocalhost =
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === '::ffff:127.0.0.1';

    if (isLocalhost) return true;

    throw new UnauthorizedException('Authentication required');
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
