import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
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
import { EventsService } from './events.service';
import { EventListFilters } from './types/dtos/list.event';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/auth/user.entity';
import { AuthGuardJwt } from 'src/auth/auth-guards';

@Controller('/events')
@SerializeOptions({ strategy: 'exposeAll' })
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Query() filter: EventListFilters = {}) {
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

      const events = await this.repository.find(options);

      this.logger.debug(`Found ${events.length} events`);

      return events;
    }
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('service') service?: boolean,
  ) {
    if (service) {
      const event = await this.eventsService.getEventWithAttendeeCount(id);

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
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body() createEventRequest: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return await this.eventsService.createEvent(createEventRequest, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuardJwt)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchEventRequest: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.getEvent(id);

    if (event.organizerId !== user.id) {
      throw new ForbiddenException(
        null,
        'You are not authorized to change this event',
      );
    }

    return await this.eventsService.updateEvent(event, patchEventRequest);
  }

  @Delete(':id')
  @UseGuards(AuthGuardJwt)
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Query('service') service?: boolean,
  ) {
    if (service) {
      const event = await this.eventsService.getEvent(id);

      if (event.organizerId !== user.id) {
        throw new ForbiddenException(
          null,
          'You are not authorized to change this event',
        );
      }

      await this.eventsService.deleteEvent(id);
    } else {
      const event = await this.repository.findOneBy({ id });

      if (!event) {
        throw new NotFoundException();
      }

      if (event.organizerId !== user.id) {
        throw new ForbiddenException(
          null,
          'You are not authorized to change this event',
        );
      }

      await this.repository.remove(event);
    }
  }
}
