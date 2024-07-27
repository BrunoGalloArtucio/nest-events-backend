import { Repository } from 'typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './types/entities/event.entity';
import { PaginationResult } from './types/pagination';
import { User } from '../auth/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('EventsController tests', () => {
  let eventsController: EventsController;
  let eventsService: EventsService;
  let eventsRepository: Repository<Event>;

  beforeEach(() => {
    jest.clearAllMocks();

    eventsService = new EventsService(eventsRepository);
    eventsController = new EventsController(eventsService);
  });

  it('should return a list of events ', async () => {
    const mockResult: PaginationResult<Event> = {
      data: [],
      total: 0,
    };
    eventsService.getEvents = jest.fn().mockImplementation(() => mockResult);

    const eventsList: PaginationResult<Event> =
      await eventsController.findAll();

    expect(eventsList).toEqual(mockResult);
    expect(eventsService.getEvents).toHaveBeenCalledTimes(1);
  });

  it('should not delete an event when it is not found', async () => {
    expect.assertions(4);

    eventsService.getEvent = jest.fn().mockReturnValue(Promise.resolve(null));
    eventsService.deleteEvent = jest.fn();
    const eventId = 1;

    try {
      const user = new User();
      await eventsController.remove(eventId, user);
    } catch (err) {
      expect(err).toEqual(new NotFoundException());
    }

    expect(eventsService.deleteEvent).not.toHaveBeenCalled();
    expect(eventsService.getEvent).toHaveBeenCalledTimes(1);
    expect(eventsService.getEvent).toHaveBeenCalledWith(eventId);
  });
});
