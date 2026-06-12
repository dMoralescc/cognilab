import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Professional } from '@prisma/client';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';

@ApiTags('results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  create(@CurrentUser() user: Professional, @Body() dto: CreateResultDto) {
    return this.resultsService.create(user.id, dto);
  }
}
