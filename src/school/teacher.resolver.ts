import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaginatedTeachers, Teacher } from './teacher.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TeacherAddInput } from './input/teacher-add.input';
import { Logger, UseGuards } from '@nestjs/common';
import { Subject } from './subject.entity';
import { TeacherEditInput } from './input/teacher-edit.input';
import { EntityWithId } from './school.types';
import { AuthGuardJwtGql } from '../auth/auth-guards';
import { paginate } from '../events/types/pagination';

@Resolver(() => Teacher)
export class TeacherResolver {
  private readonly logger: Logger = new Logger(TeacherResolver.name);

  constructor(
    @InjectRepository(Teacher)
    private readonly teachersRepository: Repository<Teacher>,
  ) {}

  @Query(() => PaginatedTeachers)
  public async teachers(
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedTeachers> {
    const query = this.teachersRepository
      .createQueryBuilder('t')
      .orderBy('t.id', 'DESC');

    return await paginate(query, { limit, offset });
  }

  @Query(() => Teacher)
  public async teacher(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Teacher> {
    return await this.teachersRepository.findOneOrFail({
      where: { id },
    });
  }

  // If name is not specified in second argument, the query/mutation is
  // named after the method
  @Mutation(() => Teacher, { name: 'teacherAdd' })
  @UseGuards(AuthGuardJwtGql)
  public async add(
    @Args('input', { type: () => TeacherAddInput }) input: TeacherAddInput,
  ): Promise<Teacher> {
    const teacher = new Teacher(input);
    return await this.teachersRepository.save(teacher);
  }

  @ResolveField('subjects', () => [Subject])
  public async sujects(@Parent() teacher: Teacher): Promise<Subject[]> {
    return await teacher.subjects;
  }

  @Mutation(() => Teacher, { name: 'teacherEdit' })
  public async edit(
    @Args('id', { type: () => Int }) id: number,
    @Args('input', { type: () => TeacherEditInput }) input: TeacherEditInput,
  ): Promise<Teacher> {
    const teacher = await this.teachersRepository.findOneOrFail({
      where: { id },
    });
    return await this.teachersRepository.save(
      new Teacher({ ...teacher, ...input }),
    );
  }

  @Mutation(() => EntityWithId, { name: 'teacherDelete' })
  public async delete(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<EntityWithId> {
    const teacher = await this.teachersRepository.findOneByOrFail({ id });
    await this.teachersRepository.remove(teacher);
    return new EntityWithId(id);
  }
}
