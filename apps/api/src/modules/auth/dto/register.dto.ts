import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  declare name: string;

  @ApiProperty({ example: 'maria@clinica.es' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'contraseña-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  declare password: string;
}
