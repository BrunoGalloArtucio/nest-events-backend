import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './types/entities/event.entity';
import { DeleteResult, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { AttendeeAnswerEnum } from './types/entities/attendee.entity';
import { ListEvents } from './types/dtos/list.event';
import { PaginationResult, paginate } from './types/pagination';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'DESC');
  }

  private getEventsWithAttendeesBaseQuery() {
    let query = this.eventsRepository
      .createQueryBuilder('e')
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees');

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

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeesBaseQuery().where('e.id = :id', {
      id,
    });

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public async getEvents(
    filter?: ListEvents,
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

  public async deleteEvent(id: number): Promise<DeleteResult> {
    return await this.eventsRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
