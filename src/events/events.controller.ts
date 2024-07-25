import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateEventDto } from './types/dtos/create-event.dto';
import { UpdateEventDto } from './types/dtos/update-event.dto';
import {
  FindManyOptions,
  LessThanOrEqual,
  MoreThanOrEqual,
  Between,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './types/entities/event.entity';
import { Attendee } from './types/entities/attendee.entity';
import { CreateAttendeeDto } from './types/dtos/create-attendee.dto copy';
import { EventsService } from './events.service';
import { ListEvents } from './types/dtos/list.event';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Event>,
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filter: ListEvents = {}) {
    this.logger.log(JSON.stringify(filter, null, 4));

    if (filter.service) {
      const events = await this.eventsService.getEvents(filter);
      return events;
    } else {
      const options: FindManyOptions<Event> = {
        take: filter.limit,
        skip: filter.offset,
      };
      if (filter.startDate && filter.endDate) {
        options.where = {
          when: Between(new Date(filter.startDate), new Date(filter.endDate)),
        };
      } else if (filter.startDate) {
        options.where = {
          when: MoreThanOrEqual(new Date(filter.startDate)),
        };
      } else if (filter.endDate) {
        options.where = {
          when: LessThanOrEqual(new Date(filter.endDate)),
        };
      }

      this.logger.log(JSON.stringify(options, null, 4));
      const events = await this.repository.find(options);

      this.logger.debug(`Found ${events.length} events`);

      return events;
    }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('service') service?: boolean,
  ) {
    if (service) {
      const event = await this.eventsService.getEvent(id);

      if (!event) {
        throw new NotFoundException();
      }

      return event;
    } else {
      const event = await this.repository.findOne({
        where: {
          id,
        },
        relations: ['attendees'],
      });

      if (!event) {
        throw new NotFoundException();
      }

      return event;
    }
  }

  @Post()
  async create(@Body() createEventRequest: CreateEventDto) {
    return await this.repository.save({
      ...createEventRequest,
      when: new Date(createEventRequest.when),
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchEventRequest: UpdateEventDto,
  ) {
    const event = await this.repository.findOneBy({ id });

    if (!event) {
      throw new NotFoundException();
    }

    return await this.repository.save({
      ...event,
      ...patchEventRequest,
      when: patchEventRequest.when
        ? new Date(patchEventRequest.when)
        : event.when,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('service') service?: boolean,
  ) {
    if (service) {
      const res = await this.eventsService.deleteEvent(id);
      if (!res.affected) {
        throw new NotFoundException();
      }
    } else {
      const event = await this.repository.findOneBy({ id });

      if (!event) {
        throw new NotFoundException();
      }

      await this.repository.remove(event);
    }
  }

  @Post(':id/attendees')
  async addAttendee(
    @Param('id', ParseIntPipe) id: number,
    @Body() attendeeDto: CreateAttendeeDto,
  ) {
    const event = await this.repository.findOne({
      where: { id },
      relations: ['attendees'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const attendee = new Attendee();
    attendee.name = attendeeDto.name;
    event.attendees.push(attendee);

    return await this.repository.save(event);
  }
}
