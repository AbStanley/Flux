import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateSettingsDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('settings')
  getSettings(@Request() req: AuthenticatedRequest) {
    return this.usersService.getSettings(req.user.id);
  }

  @Patch('settings')
  updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() settings: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(req.user.id, settings);
  }
}
