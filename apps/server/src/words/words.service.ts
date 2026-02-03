import { Injectable } from '@nestjs/common';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) { }

  async create(createWordDto: CreateWordDto) {
    // For now, use a default user since we don't have auth yet
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: 'default@local.com' },
      });
    }

    const sanitizedText = createWordDto.text
      .replace(/[.,"'()<>/\\;{}[\]=+&]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Duplicate Check
    const existingWord = await this.prisma.word.findFirst({
      where: {
        text: sanitizedText,
        sourceLanguage: createWordDto.sourceLanguage,
        targetLanguage: createWordDto.targetLanguage,
        userId: user.id,
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
        definition: createWordDto.definition,
        explanation: createWordDto.explanation,
        context: createWordDto.context,
        sourceLanguage: createWordDto.sourceLanguage,
        targetLanguage: createWordDto.targetLanguage,
        sourceTitle: createWordDto.sourceTitle,
        imageUrl: createWordDto.imageUrl,
        pronunciation: createWordDto.pronunciation,
        type: createWordDto.type, // Map the type from DTO
        userId: user.id,
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
    sort?: 'date_desc' | 'date_asc' | 'text_asc';
    skip?: number;
    limit?: number;
    type?: 'word' | 'phrase';
  }) {
    const { sourceLanguage, targetLanguage, sort, skip, limit, type } =
      query || {};

    const where: Prisma.WordWhereInput = {
      sourceLanguage: sourceLanguage ? { equals: sourceLanguage, mode: 'insensitive' as Prisma.QueryMode } : undefined,
      targetLanguage: targetLanguage ? { equals: targetLanguage, mode: 'insensitive' as Prisma.QueryMode } : undefined,
      type,
    };

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
    const { examples, ...wordData } = updateWordDto as any;

    // Use transaction to atomically update word and replace examples
    return this.prisma.$transaction(async (tx) => {
      // Delete all existing examples for this word
      await tx.example.deleteMany({ where: { wordId: id } });

      // Update word and create new examples
      return tx.word.update({
        where: { id },
        data: {
          ...wordData,
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
    });
  }

  remove(id: string) {
    return this.prisma.word.delete({
      where: { id },
    });
  }

  async getLanguages() {
    const words = await this.prisma.word.findMany({
      distinct: ['sourceLanguage', 'targetLanguage'],
      select: {
        sourceLanguage: true,
        targetLanguage: true,
      },
      where: {
        sourceLanguage: { not: null },
        targetLanguage: { not: null },
      },
    });

    return words;
  }
}
