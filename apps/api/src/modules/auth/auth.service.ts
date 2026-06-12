import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.professional.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const professional = await this.prisma.professional.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: passwordHash,
        verificationToken,
        verificationTokenExpiresAt,
      },
      select: { id: true, email: true, name: true },
    });

    const mailEnabled = this.config.get('MAIL_ENABLED') !== 'false';

    if (mailEnabled) {
      await this.mail.sendVerificationEmail(dto.email, dto.name, verificationToken);
    } else {
      await this.prisma.professional.update({
        where: { id: professional.id },
        data: { emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
      });
    }

    const tokens = await this.generateTokens(professional.id, professional.email);
    await this.saveRefreshToken(professional.id, tokens.refreshToken);

    return { professional, ...tokens };
  }

  async login(dto: LoginDto) {
    const professional = await this.prisma.professional.findUnique({
      where: { email: dto.email },
    });
    if (!professional) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordMatch = await bcrypt.compare(dto.password, professional.password);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales incorrectas');

    if (!professional.emailVerified) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de entrar');
    }

    const tokens = await this.generateTokens(professional.id, professional.email);
    await this.saveRefreshToken(professional.id, tokens.refreshToken);

    return {
      professional: { id: professional.id, email: professional.email, name: professional.name },
      ...tokens,
    };
  }

  async refreshTokens(professionalId: string, refreshToken: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional?.refreshToken) throw new UnauthorizedException();

    const tokenMatch = await bcrypt.compare(refreshToken, professional.refreshToken);
    if (!tokenMatch) throw new UnauthorizedException();

    const tokens = await this.generateTokens(professional.id, professional.email);
    await this.saveRefreshToken(professional.id, tokens.refreshToken);
    return tokens;
  }

  async logout(professionalId: string) {
    await this.prisma.professional.update({
      where: { id: professionalId },
      data: { refreshToken: null },
    });
  }

  async verifyEmail(token: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { verificationToken: token },
    });

    if (!professional) throw new NotFoundException('Token de verificación inválido');

    if (
      professional.verificationTokenExpiresAt &&
      professional.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('El token de verificación ha expirado');
    }

    await this.prisma.professional.update({
      where: { id: professional.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return { message: 'Correo verificado correctamente' };
  }

  async resendVerification(email: string) {
    const professional = await this.prisma.professional.findUnique({ where: { email } });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    if (professional.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.professional.update({
      where: { id: professional.id },
      data: { verificationToken, verificationTokenExpiresAt },
    });

    await this.mail.sendVerificationEmail(email, professional.name, verificationToken);
    return { message: 'Correo de verificación reenviado' };
  }

  private async generateTokens(sub: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub, email },
        {
          secret: this.config.getOrThrow('JWT_SECRET'),
          expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
        },
      ),
      this.jwt.signAsync(
        { sub, email },
        {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(professionalId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.professional.update({
      where: { id: professionalId },
      data: { refreshToken: hash },
    });
  }
}
