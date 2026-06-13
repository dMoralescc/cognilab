import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPatientPayload {
  sub: string;
  role: 'patient';
}

@Injectable()
export class JwtPatientStrategy extends PassportStrategy(Strategy, 'jwt-patient') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPatientPayload) {
    if (payload.role !== 'patient') throw new UnauthorizedException();

    const patient = await this.prisma.patient.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, professionalId: true, archivedAt: true },
    });

    if (!patient || patient.archivedAt) throw new UnauthorizedException();
    return patient;
  }
}
