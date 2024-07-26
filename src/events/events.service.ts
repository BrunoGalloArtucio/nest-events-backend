import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './types/entities/event.entity';
import { DeleteResult, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AttendeeAnswerEnum } from './types/entities/attendee.entity';
import { EventListFilters } from './types/dtos/list.event';
import { PaginationResult, paginate } from './types/pagination';
import { CreateEventDto } from './types/dtos/create-event.dto';
import { User } from 'src/auth/user.entity';
import { UpdateEventDto } from './types/dtos/update-event.dto';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  public async createEvent(
    createEventRequest: CreateEventDto,
    user: User,
  ): Promise<Event> {
    const newEvent = new Event({
      ...createEventRequest,
      when: new Date(createEventRequest.when),
      organizer: user,
    });
    return await this.eventsRepository.save(newEvent);
  }

  private getEventsBaseQuery(): SelectQueryBuilder<Event> {
    return this.eventsRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'DESC');
  }

  private getEventsWithAttendeesBaseQuery(): SelectQueryBuilder<Event> {
    let query = this.getEventsBaseQuery().loadRelationCountAndMap(
      'e.attendeeCount',
      'e.attendees',
    );

    query = this.addColumnForAnswer(
      query,
      'e.attendeeAccepted',
      AttendeeAnswerEnum.Accepted,
    );
    query = this.addColumnForAnswer(
      query,
      'e.attendeeMaybe',
      AttendeeAnswerEnum.Maybe,
    );
    query = this.addColumnForAnswer(
      query,
      'e.attendeeRejected',
      AttendeeAnswerEnum.Rejected,
    );

    return query;
  }

  private addColumnForAnswer(
    query: SelectQueryBuilder<Event>,
    columnName: string,
    answer: AttendeeAnswerEnum,
  ): SelectQueryBuilder<Event> {
    return query.loadRelationCountAndMap(
      columnName,
      'e.attendees',
      'attendee',
      (qb) =>
        qb.where('attendee.answer = :answer', {
          answer,
        }),
    );
  }

  public async getEventWithAttendeeCount(
    id: number,
  ): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeesBaseQuery().where('e.id = :id', {
      id,
    });

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public async getEvents(
    filter?: EventListFilters,
  ): Promise<PaginationResult<Event>> {
    let query = this.getEventsWithAttendeesBaseQuery();

    if (filter?.startDate) {
      query = query.andWhere('e.when >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter?.endDate) {
      query = query.andWhere('e.when <= :endDate', {
        endDate: filter.endDate,
      });
    }

    this.logger.debug(query.getSql());

    return await paginate(query, filter);
  }

  public async getEvent(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOneBy({ id });

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  public async deleteEvent(id: number): Promise<DeleteResult> {
    return await this.eventsRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }

  public async updateEvent(
    event: Event,
    patchEventRequest: UpdateEventDto,
  ): Promise<Event> {
    const updatedEvent = new Event({
      ...event,
      ...patchEventRequest,
      when: patchEventRequest.when
        ? new Date(patchEventRequest.when)
        : event.when,
    });
    return await this.eventsRepository.save(updatedEvent);
  }

  public async getEventsOrganizedByUser(
    userId: number,
    filter: EventListFilters,
  ): Promise<PaginationResult<Event>> {
    const query = this.getEventsBaseQuery().where('e.organizerId = :userId', {
      userId,
    });

    return await paginate<Event>(query, filter);
  }

  public async getEventsAttendedByUser(
    userId: number,
    filter: EventListFilters,
  ): Promise<PaginationResult<Event>> {
    const query = this.getEventsBaseQuery()
      .leftJoinAndSelect('e.attendees', 'a')
      .where('a.userId = :userId', { userId });

    return await paginate<Event>(query, filter);
  }
}
