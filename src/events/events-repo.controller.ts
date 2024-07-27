import {
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
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  FindManyOptions,
  LessThanOrEqual,
  MoreThanOrEqual,
  Between,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './types/entities/event.entity';
import { EventListFilters } from './types/dtos/list.event';
import { CurrentUser } from './../auth/current-user.decorator';
import { User } from './../auth/user.entity';
import { AuthGuardJwt } from './../auth/auth-guards';

@Controller('/events')
@SerializeOptions({ strategy: 'exposeAll' })
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Query() filter: EventListFilters = {}) {
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

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Param('id', ParseIntPipe) id: number) {
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

  @Delete(':id')
  @UseGuards(AuthGuardJwt)
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
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
