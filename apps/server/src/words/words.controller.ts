import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { SrsService, type SrsQuality } from './srs.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { ReviewWordDto } from './dto/review-word.dto';

interface AuthenticatedRequest {
  user?: { id: string; email: string };
}

@Controller('api/words')
export class WordsController {
  constructor(
    private readonly wordsService: WordsService,
    private readonly srsService: SrsService,
  ) {}

  @Post()
  create(
    @Body() createWordDto: CreateWordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.wordsService.create(createWordDto, req.user?.id);
  }

  @Get()
  async findAll(
    @Query()
    query: {
      sourceLanguage?: string;
      targetLanguage?: string;
      sort?: 'date_desc' | 'date_asc' | 'text_asc';
      page?: string;
      limit?: string;
      type?: 'word' | 'phrase';
    },
    @Request() req: AuthenticatedRequest,
  ) {
    const page = query.page ? Math.max(1, +query.page) : 1;
    const limit = query.limit ? Math.min(50, Math.max(1, +query.limit)) : 10;
    const skip = (page - 1) * limit;

    try {
      return await this.wordsService.findAll({
        ...query,
        skip,
        limit,
        userId: req.user?.id,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown server error';
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, error: message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('due')
  getDueWords(
    @Query()
    query: {
      sourceLanguage?: string;
      targetLanguage?: string;
      deckId?: string;
      limit?: string;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.srsService.getDueWords(req.user?.id ?? '', {
      sourceLanguage: query.sourceLanguage,
      targetLanguage: query.targetLanguage,
      deckId: query.deckId,
      limit: query.limit ? Math.min(50, Math.max(1, +query.limit)) : 20,
    });
  }

  @Get('srs-stats')
  getSrsStats(@Request() req: AuthenticatedRequest) {
    return this.srsService.getStats(req.user?.id ?? '');
  }

  @Post(':id/review')
  async reviewWord(
    @Param('id') id: string,
    @Body() reviewDto: ReviewWordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const word = await this.wordsService.findOne(id);
    const userId = req.user?.id ?? (await this.srsService.resolveUserId());
    if (!word || word.userId !== userId) {
      throw new HttpException('Word not found', HttpStatus.NOT_FOUND);
    }
    return this.srsService.recordReview(id, reviewDto.quality as SrsQuality);
  }

  @Get('languages')
  getLanguages(@Request() req: AuthenticatedRequest) {
    return this.wordsService.getLanguages(req.user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(id) as unknown;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWordDto: UpdateWordDto) {
    return this.wordsService.update(id, updateWordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(id) as unknown;
  }
}
