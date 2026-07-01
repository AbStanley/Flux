import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UserPayload {
  id: string;
  email: string;
}

interface CustomRequest {
  user?: UserPayload;
}

@Injectable()
export class AiQuotaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();

    const request: CustomRequest = httpContext.getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException(
        'Authentication required to use AI features.',
      );
    }

    const userId = user.id;

    const userDb = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiRequestsToday: true,
        lastAiRequestAt: true,
        dailyAiLimit: true,
      },
    });

    if (!userDb) {
      throw new UnauthorizedException('User not found.');
    }

    const { aiRequestsToday, lastAiRequestAt, dailyAiLimit } = userDb;

    const now = new Date();
    const lastRequest = new Date(lastAiRequestAt);
    const isNewDay =
      now.getUTCDate() !== lastRequest.getUTCDate() ||
      now.getUTCMonth() !== lastRequest.getUTCMonth() ||
      now.getUTCFullYear() !== lastRequest.getUTCFullYear();

    let updatedRequestsToday = aiRequestsToday;

    if (isNewDay) {
      updatedRequestsToday = 0;
    }

    const defaultLimit = process.env.DEFAULT_DAILY_AI_LIMIT
      ? parseInt(process.env.DEFAULT_DAILY_AI_LIMIT, 10)
      : 100;

    const limitToEnforce = dailyAiLimit === 100 ? defaultLimit : dailyAiLimit;

    if (limitToEnforce !== -1 && updatedRequestsToday >= limitToEnforce) {
      throw new ForbiddenException(
        `Daily AI request limit reached (${limitToEnforce} requests). Contact the administrator for extended access.`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        aiRequestsToday: updatedRequestsToday + 1,
        lastAiRequestAt: now,
      },
    });

    return true;
  }
}
