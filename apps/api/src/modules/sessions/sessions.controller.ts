import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
interface AuthUser { id: string; email: string; name: string; }
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user.id, dto);
  }

  @Get()
  @ApiQuery({ name: 'patientId', required: true })
  findAll(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string) {
    return this.sessionsService.findAll(user.id, patientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionsService.findOne(user.id, id);
  }

  @Patch(':id/start')
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionsService.start(user.id, id);
  }

  @Patch(':id/expire')
  expire(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionsService.expire(user.id, id);
  }
}
