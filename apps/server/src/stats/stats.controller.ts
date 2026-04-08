import { Controller, Get, Query, Request } from '@nestjs/common';
import { StatsService } from './stats.service';

interface AuthenticatedRequest {
  user?: { id: string; email: string };
}

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  getOverview(@Request() req: AuthenticatedRequest) {
    return this.statsService.getOverview(req.user?.id ?? '');
  }

  @Get('activity')
  getActivity(
    @Query('days') days: string,
    @Query('offset') offset: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const numDays = days ? Math.min(90, Math.max(7, +days)) : 30;
    const numOffset = offset ? Math.max(0, +offset) : 0;
    return this.statsService.getActivity(req.user?.id ?? '', numDays, numOffset);
  }
}
