import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Professional } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@CurrentUser() user: Professional, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user.id, dto);
  }

  @Get()
  @ApiQuery({ name: 'patientId', required: true })
  findAll(@CurrentUser() user: Professional, @Query('patientId') patientId: string) {
    return this.sessionsService.findAll(user.id, patientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: Professional, @Param('id') id: string) {
    return this.sessionsService.findOne(user.id, id);
  }

  @Patch(':id/start')
  start(@CurrentUser() user: Professional, @Param('id') id: string) {
    return this.sessionsService.start(user.id, id);
  }

  @Patch(':id/expire')
  expire(@CurrentUser() user: Professional, @Param('id') id: string) {
    return this.sessionsService.expire(user.id, id);
  }
}
