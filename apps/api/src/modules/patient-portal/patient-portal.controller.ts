import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientPortalService } from './patient-portal.service';
import { JwtPatientGuard } from '../auth/guards/jwt-patient.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface PatientUser { id: string; name: string; email: string | null }

@ApiTags('Patient Portal')
@ApiBearerAuth()
@UseGuards(JwtPatientGuard)
@Controller('patient')
export class PatientPortalController {
  constructor(private service: PatientPortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener datos del paciente autenticado' })
  getMe(@CurrentUser() user: PatientUser) {
    return this.service.getMe(user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones del paciente' })
  getSessions(@CurrentUser() user: PatientUser) {
    return this.service.getSessions(user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Obtener una sesión del paciente' })
  getSession(@CurrentUser() user: PatientUser, @Param('id') id: string) {
    return this.service.getSession(user.id, id);
  }

  @Post('results')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar resultado de un ejercicio' })
  submitResult(
    @CurrentUser() user: PatientUser,
    @Body() body: { sessionItemId: string; hits: number; errors: number; reactionTimeMs?: number; rawData?: Record<string, unknown> },
  ) {
    return this.service.submitResult(user.id, body.sessionItemId, body.hits, body.errors, body.reactionTimeMs, body.rawData);
  }
}
