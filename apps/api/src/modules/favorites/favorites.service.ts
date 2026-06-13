import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(professionalId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { professionalId },
      select: { exerciseId: true },
    });
    return rows.map((r) => r.exerciseId);
  }

  async toggle(professionalId: string, exerciseId: string): Promise<{ favorited: boolean }> {
    const existing = await this.prisma.favorite.findUnique({
      where: { professionalId_exerciseId: { professionalId, exerciseId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({ data: { professionalId, exerciseId } });
    return { favorited: true };
  }
}
