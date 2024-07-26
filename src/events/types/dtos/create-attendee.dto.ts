import { IsEnum } from 'class-validator';
import { AttendeeAnswerEnum } from '../entities/attendee.entity';

export class CreateAttendeeDto {
  @IsEnum(AttendeeAnswerEnum)
  answer: AttendeeAnswerEnum;
}
