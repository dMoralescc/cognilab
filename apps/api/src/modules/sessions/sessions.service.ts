import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(professionalId: string, dto: CreateSessionDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { professionalId: true },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    if (patient.professionalId !== professionalId) throw new ForbiddenException();

    return this.prisma.session.create({
      data: {
        patientId: dto.patientId,
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.remote !== undefined && { remote: dto.remote }),
        items: {
          create: dto.items.map((it) => ({
            exerciseId: it.exerciseId,
            level: it.level,
            order: it.order,
          })),
        },
      },
      include: {
        items: {
          include: { exercise: { select: { slug: true, title: true, description: true, cognitiveArea: true, minLevel: true, maxLevel: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll(professionalId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { professionalId: true },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    if (patient.professionalId !== professionalId) throw new ForbiddenException();

    return this.prisma.session.findMany({
      where: { patientId },
      include: {
        items: {
          include: {
            exercise: { select: { slug: true, title: true, description: true, cognitiveArea: true, minLevel: true, maxLevel: true } },
            result: { select: { hits: true, errors: true, reactionTimeMs: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(professionalId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        patient: { select: { professionalId: true, name: true } },
        items: {
          include: {
            exercise: true,
            result: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.patient.professionalId !== professionalId) throw new ForbiddenException();

    return session;
  }

  async start(professionalId: string, sessionId: string) {
    const session = await this.assertOwnership(professionalId, sessionId);

    return this.prisma.session.update({
      where: { id: session.id },
      data: { status: 'IN_PROGRESS', startAt: new Date() },
    });
  }

  async expire(professionalId: string, sessionId: string) {
    const session = await this.assertOwnership(professionalId, sessionId);

    return this.prisma.session.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
  }

  private async assertOwnership(professionalId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { patient: { select: { professionalId: true } } },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.patient.professionalId !== professionalId) throw new ForbiddenException();
    return session;
  }
}
