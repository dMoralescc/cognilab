import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser { id: string; email: string }

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear paciente' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pacientes del profesional' })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('archived') archived?: string,
  ) {
    return this.patientsService.findAll(user.id, archived === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener paciente con historial de sesiones' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos del paciente' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user.id, id, dto);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archivar paciente' })
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.archive(user.id, id);
  }

  @Patch(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desarchivar paciente' })
  unarchive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.unarchive(user.id, id);
  }
}
