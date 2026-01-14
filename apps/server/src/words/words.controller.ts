import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Controller('api/words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) { }

  @Post()
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
  }

  @Get()
  async findAll(@Query() query: {
    sourceLanguage?: string;
    targetLanguage?: string;
    sort?: 'date_desc' | 'date_asc' | 'text_asc';
    skip?: string;
    take?: string;
    type?: 'word' | 'phrase';
  }) {
    console.log('GET /api/words query:', query);
    try {
      return await this.wordsService.findAll({
        ...query,
        skip: query.skip ? +query.skip : undefined,
        take: query.take ? +query.take : undefined,
      });
    } catch (error: any) {
      console.error('Error in findAll:', error);
      // Return the error message to the client for debugging
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message || 'Unknown server error',
        stack: error.stack,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWordDto: UpdateWordDto) {
    return this.wordsService.update(id, updateWordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(id);
  }
}
