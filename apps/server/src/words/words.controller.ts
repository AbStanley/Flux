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
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

interface AuthenticatedRequest {
  user?: { id: string; email: string };
}

@Controller('api/words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) { }

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

  @Get('languages')
  getLanguages() {
    return this.wordsService.getLanguages();
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

