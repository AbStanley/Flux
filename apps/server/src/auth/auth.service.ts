import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    return this.buildTokenResponse(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.buildTokenResponse(user.id, user.email);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email };
  }

  async getFreshProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        aiRequestsToday: true,
        dailyAiLimit: true,
        tokensToday: true,
        tokensTotal: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const defaultLimit = process.env.DEFAULT_DAILY_AI_LIMIT
      ? parseInt(process.env.DEFAULT_DAILY_AI_LIMIT, 10)
      : 100;

    const dailyAiLimit = user.dailyAiLimit === 100 ? defaultLimit : user.dailyAiLimit;

    return {
      ...user,
      dailyAiLimit,
    };
  }

  private buildTokenResponse(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email },
    };
  }
}
