import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_LIMIT = 10;
export const DEFAULT_OFFSET = 0;

export class EventListFilters {
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
  limit?: number = DEFAULT_LIMIT;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  offset?: number = DEFAULT_OFFSET;
}
