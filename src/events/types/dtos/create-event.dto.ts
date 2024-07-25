import { IsDateString, IsString, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(5, 255, { message: 'Name must have at least 5 characters' })
  name: string;

  @IsString()
  @Length(5, 255)
  description: string;

  @IsDateString()
  when: string;

  @IsString()
  @Length(5, 255)
  address: string;
}
