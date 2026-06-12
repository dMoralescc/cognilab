import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, IsObject } from 'class-validator';

export class CreateResultDto {
  @ApiProperty()
  @IsString()
  declare sessionItemId: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  declare hits: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  declare errors: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  declare reactionTimeMs: number | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  declare rawData: Record<string, unknown> | undefined;
}
