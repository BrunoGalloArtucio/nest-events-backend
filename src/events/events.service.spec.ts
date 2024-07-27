import { DeleteQueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { EventsService } from './events.service';
import { Event } from './types/entities/event.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as paginator from './types/pagination';

jest.mock('./types/pagination');

describe('EventsService', () => {
  let service: EventsService;
  let repository: Repository<Event>;
  let selectQb: Partial<SelectQueryBuilder<Event>> = {};
  let deleteQb: Partial<DeleteQueryBuilder<Event>> = {};
  let mockedPaginate;

  beforeEach(async () => {
    mockedPaginate = paginator.paginate as jest.Mock;
    deleteQb = {
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    selectQb = {
      delete: jest.fn().mockReturnValue(deleteQb),
      andWhere: jest.fn(),
      where: jest.fn(),
      execute: jest.fn(),
      orderBy: jest.fn(),
      leftJoinAndSelect: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            save: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(selectQb),
            delete: jest.fn(),
            where: jest.fn(),
            andWhere: jest.fn(),
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  describe('updateEvent', () => {
    it('should update the event', async () => {
      const repoSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ id: 1 } as Event);

      expect(
        service.updateEvent(new Event({ id: 1 }), { name: 'new name' }),
      ).resolves.toEqual({ id: 1 });

      expect(repoSpy).toHaveBeenCalledWith({ id: 1, name: 'new name' });
      expect(repoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEvent', () => {
    it('should delete the event', async () => {
      const createQueryBuilderSpy = jest.spyOn(
        repository,
        'createQueryBuilder',
      );
      const deleteSpy = jest.spyOn(selectQb, 'delete');
      const whereSpy = jest.spyOn(deleteQb, 'where');
      const executeSpy = jest.spyOn(deleteQb, 'execute');

      expect(service.deleteEvent(1)).resolves.toBe(undefined);
      expect(createQueryBuilderSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(whereSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEventsAttendedByUser', () => {
    it('should return a list of paginated events', async () => {
      const orderBySpy = jest
        .spyOn(selectQb, 'orderBy')
        .mockReturnValue(selectQb as SelectQueryBuilder<Event>);
      const leftJoinSpy = jest
        .spyOn(selectQb, 'leftJoinAndSelect')
        .mockReturnValue(selectQb as SelectQueryBuilder<Event>);
      const whereSpy = jest
        .spyOn(selectQb, 'andWhere')
        .mockReturnValue(selectQb as SelectQueryBuilder<Event>);

      mockedPaginate.mockResolvedValue({
        total: 10,
        data: [],
      });

      expect(
        service.getEventsAttendedByUser(500, {
          limit: 1,
          offset: 1,
        }),
      ).resolves.toEqual({
        data: [],
        total: 10,
      });

      expect(orderBySpy).toHaveBeenCalledTimes(1);
      expect(orderBySpy).toHaveBeenCalledWith('e.id', 'DESC');

      expect(leftJoinSpy).toHaveBeenCalledTimes(1);
      expect(leftJoinSpy).toHaveBeenCalledWith('e.attendees', 'a');

      expect(whereSpy).toHaveBeenCalledTimes(1);
      expect(whereSpy).toHaveBeenCalledWith('a.userId = :userId', {
        userId: 500,
      });

      expect(mockedPaginate).toHaveBeenCalledTimes(1);
      expect(mockedPaginate).toHaveBeenCalledWith(selectQb, {
        limit: 1,
        offset: 1,
      });
    });
  });
});
