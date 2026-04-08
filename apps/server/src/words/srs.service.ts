import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SM-2 quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect recall
 */
export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5;

interface Sm2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

@Injectable()
export class SrsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Core SM-2 algorithm. Returns updated scheduling parameters.
   */
  private calculateSm2(
    quality: SrsQuality,
    prevEase: number,
    prevInterval: number,
    prevReps: number,
  ): Sm2Result {
    // If quality < 3, reset (lapse)
    if (quality < 3) {
      return {
        easeFactor: Math.max(1.3, prevEase - 0.2),
        interval: 1,
        repetitions: 0,
      };
    }

    // Successful recall
    const newEase = Math.max(
      1.3,
      prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    let newInterval: number;
    if (prevReps === 0) {
      newInterval = 1;
    } else if (prevReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(prevInterval * newEase);
    }

    return {
      easeFactor: newEase,
      interval: newInterval,
      repetitions: prevReps + 1,
    };
  }

  private async resolveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    const user = await this.prisma.user.findFirst();
    return user?.id;
  }

  /**
   * Get words due for review for a user, optionally filtered by language.
   */
  async getDueWords(
    userId: string,
    options?: {
      sourceLanguage?: string;
      targetLanguage?: string;
      deckId?: string;
      limit?: number;
    },
  ) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) return [];
    const limit = options?.limit ?? 20;

    return this.prisma.word.findMany({
      where: {
        userId: resolvedUserId,
        srsNextReview: { lte: new Date() },
        ...(options?.sourceLanguage && {
          sourceLanguage: {
            equals: options.sourceLanguage,
            mode: 'insensitive',
          },
        }),
        ...(options?.targetLanguage && {
          targetLanguage: {
            equals: options.targetLanguage,
            mode: 'insensitive',
          },
        }),
        ...(options?.deckId && { deckId: options.deckId }),
      },
      orderBy: [
        { srsNextReview: 'asc' }, // Most overdue first
      ],
      include: { examples: true },
      take: limit,
    });
  }

  /**
   * Record a review for a word and update its SRS scheduling.
   */
  async recordReview(wordId: string, quality: SrsQuality) {
    const word = await this.prisma.word.findUniqueOrThrow({
      where: { id: wordId },
    });

    const { easeFactor, interval, repetitions } = this.calculateSm2(
      quality,
      word.srsEaseFactor,
      word.srsInterval,
      word.srsRepetitions,
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return this.prisma.word.update({
      where: { id: wordId },
      data: {
        srsEaseFactor: easeFactor,
        srsInterval: interval,
        srsRepetitions: repetitions,
        srsNextReview: nextReview,
        srsLastReview: new Date(),
      },
      include: { examples: true },
    });
  }

  /**
   * Get SRS statistics for a user.
   */
  async getStats(userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      return { total: 0, due: 0, learned: 0, reviewedToday: 0 };
    }
    const now = new Date();

    const [total, due, learned, reviewed] = await this.prisma.$transaction([
      // Total words
      this.prisma.word.count({ where: { userId: resolvedUserId } }),
      // Due now
      this.prisma.word.count({
        where: { userId: resolvedUserId, srsNextReview: { lte: now } },
      }),
      // Learned (at least 1 successful review)
      this.prisma.word.count({
        where: { userId: resolvedUserId, srsRepetitions: { gte: 1 } },
      }),
      // Reviewed today
      this.prisma.word.count({
        where: {
          userId: resolvedUserId,
          srsLastReview: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
    ]);

    return { total, due, learned, reviewedToday: reviewed };
  }
}
