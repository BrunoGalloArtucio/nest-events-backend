import { IsString, Length } from 'class-validator';

export class CreateAttendeeDto {
  @IsString()
  @Length(5, 255, { message: 'Name must have at least 5 characters' })
  name: string;
}
