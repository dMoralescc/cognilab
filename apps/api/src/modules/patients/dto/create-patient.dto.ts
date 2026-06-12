import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Juan López' })
  @IsString()
  @MaxLength(100)
  declare name: string;

  @ApiPropertyOptional({ example: '1955-03-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Deterioro cognitivo leve' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
