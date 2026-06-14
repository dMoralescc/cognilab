import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PatientPortalService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async getMe(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, email: true, diagnosis: true, birthDate: true },
    });
    if (!patient) throw new NotFoundException();
    return patient;
  }

  async getSessions(patientId: string) {
    return this.prisma.session.findMany({
      where: { patientId, remote: true },
      include: {
        items: {
          include: {
            exercise: {
              select: {
                slug: true,
                title: true,
                description: true,
                cognitiveArea: true,
                minLevel: true,
                maxLevel: true,
              },
            },
            result: { select: { hits: true, errors: true, reactionTimeMs: true, completedAt: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitResult(
    patientId: string,
    sessionItemId: string,
    hits: number,
    errors: number,
    reactionTimeMs?: number,
    rawData?: Record<string, unknown>,
  ) {
    const item = await this.prisma.sessionItem.findUnique({
      where: { id: sessionItemId },
      include: {
        result: true,
        exercise: { select: { slug: true, title: true } },
        session: {
          select: {
            patientId: true,
            id: true,
            startAt: true,
            patient: { select: { professionalId: true, name: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.session.patientId !== patientId) throw new ForbiddenException();
    if (item.result) throw new ConflictException('Este ejercicio ya tiene resultado');

    await this.prisma.session.update({
      where: { id: item.session.id },
      data: { status: 'IN_PROGRESS', ...(!item.session.startAt && { startAt: new Date() }) },
    });

    const result = await this.prisma.result.create({
      data: {
        sessionItemId,
        hits,
        errors,
        ...(reactionTimeMs !== undefined && { reactionTimeMs }),
        ...(rawData !== undefined && { rawData: rawData as object }),
      },
    });

    await this.maybeCompleteSession(item.session.id);

    this.notifications.notifyProfessional(item.session.patient.professionalId, 'result:submitted', {
      patientId: item.session.patientId,
      patientName: item.session.patient.name,
      sessionId: item.session.id,
      sessionItemId,
      exerciseSlug: item.exercise.slug,
      exerciseTitle: item.exercise.title,
      hits,
      errors,
      reactionTimeMs: reactionTimeMs ?? null,
    });

    return result;
  }

  private async maybeCompleteSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { items: { include: { result: true } } },
    });
    if (!session) return;
    if (session.items.every((it: { result: unknown }) => it.result !== null)) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endAt: new Date() },
      });
    }
  }

  async getSession(patientId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            exercise: true,
            result: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!session || !session.remote) throw new NotFoundException('Sesión no encontrada');
    if (session.patientId !== patientId) throw new ForbiddenException();
    return session;
  }
}
