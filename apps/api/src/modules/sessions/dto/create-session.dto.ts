import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsArray, IsInt, IsOptional, IsBoolean, IsDateString,
  ValidateNested, Min, Max, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SessionItemDto {
  @ApiProperty()
  @IsString()
  declare exerciseId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  declare level: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  declare order: number;
}

export class CreateSessionDto {
  @ApiProperty()
  @IsString()
  declare patientId: string;

  @ApiProperty({ type: [SessionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SessionItemDto)
  declare items: SessionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare dueDate: string | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  declare remote: boolean | undefined;
}
