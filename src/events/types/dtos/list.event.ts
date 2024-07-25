import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ListEvents {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  service?: boolean;
}
