import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReadingSessionsController } from './reading-sessions.controller';
import { ReadingSessionsService } from './reading-sessions.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingSessionsController],
  providers: [ReadingSessionsService],
})
export class ReadingSessionsModule {}
