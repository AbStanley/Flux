import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        sourceLang: true,
        targetLang: true,
        customThemes: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateSettings(
    userId: string,
    settings: {
      theme?: string | null;
      sourceLang?: string | null;
      targetLang?: string | null;
      customThemes?: unknown;
    },
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(settings.theme !== undefined && { theme: settings.theme }),
        ...(settings.sourceLang !== undefined && {
          sourceLang: settings.sourceLang,
        }),
        ...(settings.targetLang !== undefined && {
          targetLang: settings.targetLang,
        }),
        ...(settings.customThemes !== undefined && {
          customThemes: settings.customThemes ?? [],
        }),
      },
      select: {
        theme: true,
        sourceLang: true,
        targetLang: true,
        customThemes: true,
      },
    });

    return updatedUser;
  }
}
