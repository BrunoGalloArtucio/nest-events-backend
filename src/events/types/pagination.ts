import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export function Paginated<T>(classRef: Type<T>) {
  @ObjectType()
  class PaginationResult<T> {
    @Field(() => Int)
    total: number;

    @Field(() => [classRef])
    data: T[];
  }

  return PaginationResult<T>;
}

export class PaginationResult<T> {
  total: number;
  data: T[];
}

export async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  options: PaginationOptions,
): Promise<PaginationResult<T>> {
  let query = qb.clone();
  if (options?.limit) {
    query = query.limit(options?.limit);
  }

  if (options?.offset) {
    query = query.offset(options?.offset);
  }

  const data = await query.getMany();
  const total = await qb.getCount();

  return {
    total,
    data,
  };
}
