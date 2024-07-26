import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Attendee } from './attendee.entity';
import { User } from 'src/auth/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Event {
  constructor(event?: Partial<Event>) {
    Object.assign(this, event);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  when: Date;

  @Column()
  address: string;

  @OneToMany(() => Attendee, (attendee) => attendee.event, { cascade: true })
  attendees: Attendee[];

  @ManyToOne(() => User, (user) => user.events)
  organizer: User;

  @Column({ nullable: true })
  @Exclude()
  organizerId: number;

  attendeeCount?: number;
  attendeeAccepted?: number;
  attendeeMaybe?: number;
  attendeeRejected?: number;
}
