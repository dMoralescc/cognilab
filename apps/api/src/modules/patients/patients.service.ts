import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(professionalId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        name: dto.name,
        diagnosis: dto.diagnosis ?? null,
        notes: dto.notes ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        professionalId,
      },
    });
  }

  async findAll(professionalId: string, includeArchived = false) {
    return this.prisma.patient.findMany({
      where: {
        professionalId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            endAt: true,
          },
        },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(professionalId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                exercise: { select: { slug: true, title: true, cognitiveArea: true } },
                result: true,
              },
            },
          },
        },
        _count: { select: { sessions: true } },
      },
    });

    if (!patient) throw new NotFoundException('Paciente no encontrado');
    if (patient.professionalId !== professionalId) throw new ForbiddenException();

    return patient;
  }

  async update(professionalId: string, patientId: string, dto: UpdatePatientDto) {
    await this.assertOwnership(professionalId, patientId);

    return this.prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis ?? null }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
        ...(dto.birthDate !== undefined && {
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        }),
      },
    });
  }

  async archive(professionalId: string, patientId: string) {
    await this.assertOwnership(professionalId, patientId);

    return this.prisma.patient.update({
      where: { id: patientId },
      data: { archivedAt: new Date() },
    });
  }

  async unarchive(professionalId: string, patientId: string) {
    await this.assertOwnership(professionalId, patientId);

    return this.prisma.patient.update({
      where: { id: patientId },
      data: { archivedAt: null },
    });
  }

  private async assertOwnership(professionalId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { professionalId: true },
    });

    if (!patient) throw new NotFoundException('Paciente no encontrado');
    if (patient.professionalId !== professionalId) throw new ForbiddenException();
  }
}
