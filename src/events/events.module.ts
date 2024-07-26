import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { Event } from './types/entities/event.entity';
import { Attendee } from './types/entities/attendee.entity';
import { EventsService } from './events.service';
import { AttendeesService } from './attendees.service';
import { EventAttendeesController } from './event-attendees.controller';
import { EventsOrganizedByUserController } from './events-organized-by-user.controller';
import { CurrentUserEventAttendaceController } from './current-user-event-attendance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Attendee])],
  controllers: [
    EventsController,
    EventAttendeesController,
    EventsOrganizedByUserController,
    CurrentUserEventAttendaceController,
  ],
  providers: [EventsService, AttendeesService],
})
export class EventsModule {}
