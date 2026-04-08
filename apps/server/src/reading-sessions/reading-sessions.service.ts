import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadingSessionsService {
  constructor(private prisma: PrismaService) {}

  private async resolveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    const user = await this.prisma.user.findFirst();
    return user?.id;
  }

  async findAll(userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) return [];

    return this.prisma.readingSession.findMany({
      where: { userId: resolvedUserId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        currentPage: true,
        totalPages: true,
        sourceLang: true,
        targetLang: true,
        fileType: true,
        chapters: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    return this.prisma.readingSession.findFirst({
      where: { id, userId: resolvedUserId },
    });
  }

  async create(
    data: {
      title: string;
      text: string;
      currentPage?: number;
      totalPages?: number;
      sourceLang?: string;
      targetLang?: string;
      fileType?: string;
      chapters?: object[];
    },
    userId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) throw new Error('User not found');

    const { chapters, ...rest } = data;
    return this.prisma.readingSession.create({
      data: {
        ...rest,
        ...(chapters !== undefined && { chapters: chapters as unknown as Prisma.InputJsonValue }),
        userId: resolvedUserId,
      },
    });
  }

  async update(
    id: string,
    data: { currentPage?: number; title?: string; totalPages?: number },
    userId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(userId);
    // Verify ownership
    const session = await this.prisma.readingSession.findFirst({
      where: { id, userId: resolvedUserId },
    });
    if (!session) return null;

    return this.prisma.readingSession.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const session = await this.prisma.readingSession.findFirst({
      where: { id, userId: resolvedUserId },
    });
    if (!session) return null;

    return this.prisma.readingSession.delete({ where: { id } });
  }
}
