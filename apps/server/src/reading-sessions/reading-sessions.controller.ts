import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReadingSessionsService } from './reading-sessions.service';

interface AuthenticatedRequest {
  user?: { id: string; email: string };
}

@Controller('api/reading-sessions')
export class ReadingSessionsController {
  constructor(private readonly service: ReadingSessionsService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.service.findAll(req.user?.id ?? '');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const session = await this.service.findOne(id, req.user?.id ?? '');
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }

  @Post()
  create(
    @Body()
    body: {
      title: string;
      text: string;
      currentPage?: number;
      totalPages?: number;
      sourceLang?: string;
      targetLang?: string;
      fileType?: string;
      chapters?: object[];
    },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.create(body, req.user?.id ?? '');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { currentPage?: number; title?: string; totalPages?: number },
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.service.update(id, body, req.user?.id ?? '');
    if (!result) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.service.remove(id, req.user?.id ?? '');
    if (!result) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}
