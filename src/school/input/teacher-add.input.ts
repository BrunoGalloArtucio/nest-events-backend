import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, Min, MinLength } from 'class-validator';
import { Gender } from '../school.types';

@InputType()
export class TeacherAddInput {
  @Field()
  @IsNotEmpty()
  @MinLength(5)
  name: string;

  @Field()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @Field()
  @IsNumber()
  @Min(18)
  age: number;
}
