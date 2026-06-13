import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExercisesService } from './exercises.service';
enum CognitiveArea {
  ATTENTION = 'ATTENTION',
  MEMORY = 'MEMORY',
  EXECUTIVE_FUNCTIONS = 'EXECUTIVE_FUNCTIONS',
  LANGUAGE = 'LANGUAGE',
  VISUOSPATIAL = 'VISUOSPATIAL',
  ORIENTATION = 'ORIENTATION',
  SOCIAL_COGNITION = 'SOCIAL_COGNITION',
}

@ApiTags('exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiQuery({ name: 'area', required: false, enum: CognitiveArea })
  findAll(@Query('area') area?: CognitiveArea) {
    return this.exercisesService.findAll(area);
  }
}
