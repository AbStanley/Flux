import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Controller('api/words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
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
  ) {
    const page = query.page ? Math.max(1, +query.page) : 1;
    // Cap limit at 50 for safety
    const limit = query.limit ? Math.min(50, Math.max(1, +query.limit)) : 10;
    const skip = (page - 1) * limit;

    console.log('GET /api/words query:', { ...query, page, skip, limit });
    try {
      return await this.wordsService.findAll({
        ...query,
        skip,
        limit,
      });
    } catch (error: unknown) {
      console.error('Error in findAll:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown server error';
      // Return the error message to the client for debugging
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: message,
        },
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
