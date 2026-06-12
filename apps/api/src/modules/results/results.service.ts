import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResultDto } from './dto/create-result.dto';

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

  async create(professionalId: string, dto: CreateResultDto) {
    const item = await this.prisma.sessionItem.findUnique({
      where: { id: dto.sessionItemId },
      include: {
        result: true,
        session: { include: { patient: { select: { professionalId: true } } } },
      },
    });

    if (!item) throw new NotFoundException('Ítem de sesión no encontrado');
    if (item.session.patient.professionalId !== professionalId) throw new ForbiddenException();
    if (item.result) throw new ConflictException('Este ejercicio ya tiene un resultado registrado');

    const data: Prisma.ResultUncheckedCreateInput = {
      sessionItemId: dto.sessionItemId,
      hits: dto.hits,
      errors: dto.errors,
    };
    if (dto.reactionTimeMs !== undefined) data.reactionTimeMs = dto.reactionTimeMs;
    if (dto.rawData !== undefined) data.rawData = dto.rawData as Prisma.InputJsonValue;

    const result = await this.prisma.result.create({ data });

    await this.maybeCompleteSession(item.session.id);

    return result;
  }

  private async maybeCompleteSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { items: { include: { result: true } } },
    });

    if (!session) return;
    const allDone = session.items.every((it) => it.result !== null);
    if (!allDone) return;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', endAt: new Date() },
    });
  }
}
