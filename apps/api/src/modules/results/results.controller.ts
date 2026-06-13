import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
interface AuthUser { id: string; email: string; name: string; }
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';

@ApiTags('results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateResultDto) {
    return this.resultsService.create(user.id, dto);
  }
}
