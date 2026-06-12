import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'maria@clinica.es' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'contraseña-segura' })
  @IsString()
  declare password: string;
}
