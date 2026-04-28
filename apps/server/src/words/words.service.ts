import { Injectable } from '@nestjs/common';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PrismaClient, Word } from '@prisma/client';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

  private sanitizeVocabularyField(value?: string): string | undefined {
    if (value === undefined || value === null) return value;

    return value
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
  }

  private async resolveUserId(userId?: string): Promise<string> {
    if (userId) return userId;
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: 'default@local.com' },
      });
    }
    return user.id;
  }

  async create(createWordDto: CreateWordDto, userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);

    const sanitizedText = this.sanitizeVocabularyField(createWordDto.text) ?? '';
    const sanitizedDefinition = this.sanitizeVocabularyField(
      createWordDto.definition,
    );

    // Duplicate Check
    const existingWord = await this.prisma.word.findFirst({
      where: {
        text: sanitizedText,
        sourceLanguage: createWordDto.sourceLanguage,
        targetLanguage: createWordDto.targetLanguage,
        userId: resolvedUserId,
      },
      include: {
        examples: true,
      },
    });

    if (existingWord) {
      return existingWord;
    }

    return this.prisma.word.create({
      data: {
        text: sanitizedText,
        definition: sanitizedDefinition,
        explanation: createWordDto.explanation,
        context: createWordDto.context,
        sourceLanguage: createWordDto.sourceLanguage,
        targetLanguage: createWordDto.targetLanguage,
        sourceTitle: createWordDto.sourceTitle,
        imageUrl: createWordDto.imageUrl,
        pronunciation: createWordDto.pronunciation,
        type: createWordDto.type, // Map the type from DTO
        userId: resolvedUserId,
        examples: createWordDto.examples
          ? {
              create: createWordDto.examples,
            }
          : undefined,
      },
      include: {
        examples: true,
      },
    });
  }

  async findAll(query?: {
    sourceLanguage?: string;
    targetLanguage?: string;
    sort?: 'date_desc' | 'date_asc' | 'text_asc' | 'random';
    skip?: number;
    limit?: number;
    type?: 'word' | 'phrase';
    userId?: string;
  }) {
    const { sourceLanguage, targetLanguage, sort, skip, limit, type, userId } =
      query || {};

    const where: Prisma.WordWhereInput = {
      sourceLanguage: sourceLanguage
        ? { equals: sourceLanguage, mode: 'insensitive' }
        : undefined,
      targetLanguage: targetLanguage
        ? { equals: targetLanguage, mode: 'insensitive' }
        : undefined,
      type,
      userId: userId ? { equals: userId } : undefined,
    };

    try {
      if (sort === 'random') {
        const items = await this.prisma.$queryRaw<Word[]>`
          SELECT * FROM "Word"
          WHERE ("sourceLanguage" ILIKE ${sourceLanguage || '%'})
            AND ("targetLanguage" ILIKE ${targetLanguage || '%'})
            AND ("type"::text = ${type || 'word'})
            AND (${userId}::text IS NULL OR "userId" = ${userId})
          ORDER BY RANDOM()
          LIMIT ${limit || 20}
        `;
        return { total: items.length, items };
      }

      const [total, items] = await this.prisma.$transaction([
        this.prisma.word.count({ where }),
        this.prisma.word.findMany({
          where,
          orderBy:
            sort === 'date_asc'
              ? { createdAt: 'asc' }
              : sort === 'text_asc'
                ? { text: 'asc' }
                : { createdAt: 'desc' },
          include: {
            examples: true,
          },
          skip,
          take: limit,
        }),
      ]);
      return { total, items };
    } catch (e) {
      console.error('Error in WordsService.findAll:', e);
      // Return empty result to prevent 500 crashes
      return { total: 0, items: [] };
    }
  }

  findOne(id: string) {
    return this.prisma.word.findUnique({
      where: { id },
      include: {
        examples: true,
      },
    });
  }

  async update(id: string, updateWordDto: UpdateWordDto) {
    const { examples, ...wordData } = updateWordDto;
    const sanitizedWordData = { ...wordData };

    if (wordData.text !== undefined) {
      sanitizedWordData.text = this.sanitizeVocabularyField(wordData.text);
    }
    if (wordData.definition !== undefined) {
      sanitizedWordData.definition = this.sanitizeVocabularyField(
        wordData.definition,
      );
    }

    // Use transaction to atomically update word and replace examples
    return await this.prisma.$transaction(
      async (
        tx: Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        >,
      ) => {
        // Delete all existing examples for this word
        await tx.example.deleteMany({ where: { wordId: id } });

        // Update word and create new examples
        return tx.word.update({
          where: { id },
          data: {
            ...sanitizedWordData,
            examples:
              examples && examples.length > 0
                ? {
                    create: examples.map(
                      (ex: { sentence: string; translation?: string }) => ({
                        sentence: ex.sentence,
                        translation: ex.translation,
                      }),
                    ),
                  }
                : undefined,
          },
          include: {
            examples: true,
          },
        });
      },
    );
  }

  remove(id: string) {
    return this.prisma.word.delete({
      where: { id },
    });
  }

  async getLanguages(userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const words = await this.prisma.word.findMany({
      distinct: ['sourceLanguage', 'targetLanguage'],
      select: {
        sourceLanguage: true,
        targetLanguage: true,
      },
      where: {
        sourceLanguage: { not: null },
        targetLanguage: { not: null },
        userId: resolvedUserId,
      },
    });

    return words;
  }
}
