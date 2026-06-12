import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CognitiveArea } from '@prisma/client';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  findAll(area?: CognitiveArea) {
    return this.prisma.exercise.findMany({
      ...(area && { where: { cognitiveArea: area } }),
      orderBy: [{ cognitiveArea: 'asc' }, { title: 'asc' }],
    });
  }
}
