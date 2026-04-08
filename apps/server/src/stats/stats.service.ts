import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private async resolveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    const user = await this.prisma.user.findFirst();
    return user?.id;
  }

  /**
   * Get a full stats overview for the dashboard.
   */
  async getOverview(userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      return {
        totalWords: 0,
        totalPhrases: 0,
        languages: [],
        srs: { total: 0, due: 0, learned: 0, reviewedToday: 0 },
        streakDays: 0,
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalWords,
      totalPhrases,
      languages,
      srsDue,
      srsLearned,
      srsReviewedToday,
      streakDays,
    ] = await Promise.all([
      this.prisma.word.count({ where: { userId: resolvedUserId, type: 'word' } }),
      this.prisma.word.count({ where: { userId: resolvedUserId, type: 'phrase' } }),
      this.getLanguageBreakdown(resolvedUserId),
      this.prisma.word.count({
        where: { userId: resolvedUserId, srsNextReview: { lte: now } },
      }),
      this.prisma.word.count({
        where: { userId: resolvedUserId, srsRepetitions: { gte: 1 } },
      }),
      this.prisma.word.count({
        where: { userId: resolvedUserId, srsLastReview: { gte: todayStart } },
      }),
      this.calculateStreak(resolvedUserId),
    ]);

    return {
      totalWords,
      totalPhrases,
      languages,
      srs: {
        total: totalWords + totalPhrases,
        due: srsDue,
        learned: srsLearned,
        reviewedToday: srsReviewedToday,
      },
      streakDays,
    };
  }

  /**
   * Get daily activity for a window of days.
   * @param days - window size (default 30)
   * @param offset - how many days back from today the window ends (0 = today)
   */
  async getActivity(userId: string, days = 30, offset = 0) {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) return [];

    const end = new Date();
    end.setDate(end.getDate() - offset);
    end.setHours(23, 59, 59, 999);

    const since = new Date(end);
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [wordsCreated, wordsReviewed] = await Promise.all([
      this.prisma.word.findMany({
        where: {
          userId: resolvedUserId,
          createdAt: { gte: since, lte: end },
        },
        select: { createdAt: true },
      }),
      this.prisma.word.findMany({
        where: {
          userId: resolvedUserId,
          srsLastReview: { gte: since, lte: end },
        },
        select: { srsLastReview: true },
      }),
    ]);

    // Build day-by-day map
    const dayMap = new Map<string, { wordsAdded: number; wordsReviewed: number }>();

    for (let d = 0; d <= days; d++) {
      const date = new Date(since);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      dayMap.set(key, { wordsAdded: 0, wordsReviewed: 0 });
    }

    for (const w of wordsCreated) {
      const key = w.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.wordsAdded++;
    }

    for (const w of wordsReviewed) {
      if (!w.srsLastReview) continue;
      const key = w.srsLastReview.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.wordsReviewed++;
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private async getLanguageBreakdown(userId: string) {
    const words = await this.prisma.word.groupBy({
      by: ['sourceLanguage', 'targetLanguage'],
      where: { userId },
      _count: true,
    });

    return words.map((w) => ({
      source: w.sourceLanguage,
      target: w.targetLanguage,
      count: w._count,
    }));
  }

  private async calculateStreak(userId: string): Promise<number> {
    // Find distinct days with reviews, going backwards from today
    const reviews = await this.prisma.word.findMany({
      where: { userId, srsLastReview: { not: null } },
      select: { srsLastReview: true },
      orderBy: { srsLastReview: 'desc' },
    });

    if (reviews.length === 0) return 0;

    const reviewDays = new Set<string>();
    for (const r of reviews) {
      if (r.srsLastReview) {
        reviewDays.add(r.srsLastReview.toISOString().slice(0, 10));
      }
    }

    let streak = 0;
    const today = new Date();

    for (let d = 0; d < 365; d++) {
      const check = new Date(today);
      check.setDate(check.getDate() - d);
      const key = check.toISOString().slice(0, 10);

      if (reviewDays.has(key)) {
        streak++;
      } else if (d === 0) {
        // Today doesn't count as breaking streak if not reviewed yet
        continue;
      } else {
        break;
      }
    }

    return streak;
  }
}
