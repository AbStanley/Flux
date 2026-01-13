import { Injectable } from '@nestjs/common';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) { }

  async create(createWordDto: CreateWordDto) {
    // For now, use a default user since we don't have auth yet
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: 'default@local.com' }
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
        userId: user.id
      },
      include: {
        examples: true
      }
    });

    if (existingWord) {
      return existingWord;
    }

    return this.prisma.word.create({
      data: {
        text: sanitizedText,
        definition: createWordDto.definition,
        context: createWordDto.context,
        sourceLanguage: createWordDto.sourceLanguage,
        targetLanguage: createWordDto.targetLanguage,
        sourceTitle: createWordDto.sourceTitle,
        imageUrl: createWordDto.imageUrl,
        pronunciation: createWordDto.pronunciation,
        type: createWordDto.type, // Map the type from DTO
        userId: user.id,
        examples: createWordDto.examples ? {
          create: createWordDto.examples
        } : undefined
      },
      include: {
        examples: true
      }
    });
  }

  async findAll(query?: {
    sourceLanguage?: string;
    targetLanguage?: string;
    sort?: 'date_desc' | 'date_asc' | 'text_asc';
    skip?: number;
    take?: number;
    type?: 'word' | 'phrase';
  }) {
    const { sourceLanguage, targetLanguage, sort, skip, take, type } = query || {};

    const where = {
      sourceLanguage,
      targetLanguage,
      type,
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.word.count({ where }),
      this.prisma.word.findMany({
        where,
        orderBy: sort === 'date_asc' ? { createdAt: 'asc' } :
          sort === 'text_asc' ? { text: 'asc' } :
            { createdAt: 'desc' },
        include: {
          examples: true
        },
        skip,
        take,
      })
    ]);

    return { total, items };
  }

  findOne(id: string) {
    return this.prisma.word.findUnique({
      where: { id },
      include: {
        examples: true
      }
    });
  }

  update(id: string, updateWordDto: UpdateWordDto) {
    // Separate examples from the rest of the data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { examples, ...wordData } = updateWordDto as any;

    // We don't support updating examples via this endpoint comfortably yet without more complex logic (upsert/delete)
    // For now, we just update the word fields. 
    // TODO: Implement thorough example updates (add/remove/update)

    return this.prisma.word.update({
      where: { id },
      data: wordData,
      include: {
        examples: true
      }
    });
  }

  remove(id: string) {
    return this.prisma.word.delete({
      where: { id },
    });
  }
}
