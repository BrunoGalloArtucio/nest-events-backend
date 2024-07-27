import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AttendeesService } from './attendees.service';
import { AuthGuardJwt } from './../auth/auth-guards';
import { CurrentUser } from './../auth/current-user.decorator';
import { User } from './../auth/user.entity';
import { CreateAttendeeDto } from './types/dtos/create-attendee.dto';
import { EventsService } from './events.service';
import { EventListFilters } from './types/dtos/list.event';
import { PaginationResult } from './types/pagination';
import { Event } from './types/entities/event.entity';

@Controller('me/events-attendance')
@SerializeOptions({ strategy: 'exposeAll' })
export class CurrentUserEventAttendaceController {
  private readonly logger = new Logger(
    CurrentUserEventAttendaceController.name,
  );

  constructor(
    private readonly eventsService: EventsService,
    private readonly attendeesService: AttendeesService,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(
    @Query() filter: EventListFilters = {},
    @CurrentUser() user: User,
  ): Promise<PaginationResult<Event>> {
    return await this.eventsService.getEventsAttendedByUser(user.id, filter);
  }

  @Get(':eventId')
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: User,
  ) {
    const attendee = await this.attendeesService.findOneByEventIdAndUserId(
      eventId,
      user.id,
    );

    if (!attendee) {
      throw new NotFoundException();
    }

    return attendee;
  }

  @Put(':eventId')
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async createOrUpdate(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() attendeeDto: CreateAttendeeDto,
    @CurrentUser() user: User,
  ) {
    return await this.attendeesService.createOrUpdate(
      attendeeDto,
      eventId,
      user.id,
    );
  }
}
