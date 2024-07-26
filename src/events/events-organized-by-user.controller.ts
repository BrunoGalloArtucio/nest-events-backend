import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Query,
  SerializeOptions,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventListFilters } from './types/dtos/list.event';

@Controller('/users/:userId/events')
@SerializeOptions({ strategy: 'exposeAll' })
export class EventsOrganizedByUserController {
  private readonly logger = new Logger(EventsOrganizedByUserController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() filter: EventListFilters = {},
  ) {
    const events = await this.eventsService.getEventsOrganizedByUser(
      userId,
      filter,
    );
    return events;
  }
}
