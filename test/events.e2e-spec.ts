import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { PaginationResult } from '../src/events/types/pagination';
import { Event } from '../src/events/types/entities/event.entity';
import { User } from '../src/auth/user.entity';
import {
  loadFixtures as loadFixturesBase,
  tokenForUser as tokenForUserBase,
} from './utils';

let app: INestApplication;
let mod: TestingModule;
let dataSource: DataSource;

const loadFixtures = async (sqlFileName: string) =>
  loadFixturesBase(dataSource, sqlFileName);

const tokenForUser = (
  user: Partial<User> = {
    id: 1,
    username: 'e2e-test',
  },
): string => tokenForUserBase(app, user);

describe('Events (e2e)', () => {
  beforeEach(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return an empty list of events', async () => {
    const response = await request(app.getHttpServer())
      .get('/events')
      .expect(200);

    const body = response.body as PaginationResult<Event>;
    expect(body.total).toBe(0);
    expect(body.data).toEqual([]);
  });

  it('should return a list of (1) event', async () => {
    await loadFixtures('1-event-1-user.sql');

    const response = await request(app.getHttpServer())
      .get('/events')
      .expect(200);

    const body = response.body as PaginationResult<Event>;
    expect(body.total).toBe(1);
    expect(body).toMatchSnapshot();
  });

  it('should return a list of (2) events', async () => {
    await loadFixtures('2-events-1-user.sql');

    const response = await request(app.getHttpServer())
      .get(`/events`)
      .expect(200);

    const body = response.body as PaginationResult<Event>;
    expect(body.total).toBe(2);
  });

  it('should return a single event', async () => {
    await loadFixtures('1-event-1-user.sql');

    const response = await request(app.getHttpServer())
      .get('/events/1')
      .expect(200);

    const body = response.body as Event;
    expect(body).toMatchSnapshot();
  });

  it('should throw a an error when creating event being unauthenticated', () => {
    return request(app.getHttpServer()).post('/events').send({}).expect(401);
  });

  it('should throw an error when creating event with wrong input', async () => {
    await loadFixtures('1-user.sql');

    const response = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      message: [
        'Name must have at least 5 characters',
        'name must be a string',
        'description must be longer than or equal to 5 characters',
        'description must be a string',
        'when must be a valid ISO 8601 date string',
        'address must be longer than or equal to 5 characters',
        'address must be a string',
      ],
      error: 'Bad Request',
    });
  });

  it('should create an event', async () => {
    await loadFixtures('1-user.sql');
    const when = new Date().toISOString();

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .send({
        name: 'E2e Event',
        description: 'A fake event from e2e tests',
        when,
        address: 'Street 123',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/events/1')
      .expect(200);

    expect(response.body).toMatchObject({
      id: 1,
      name: 'E2e Event',
      description: 'A fake event from e2e tests',
      address: 'Street 123',
    });
  });

  it('should throw an error when changing non existing event', async () => {
    await request(app.getHttpServer())
      .put('/events/100')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .send({})
      .expect(404);
  });

  it('should throw an error when changing an event of other user', async () => {
    await loadFixtures('1-event-2-users.sql');

    await request(app.getHttpServer())
      .patch('/events/1')
      .set(
        'Authorization',
        `Bearer ${tokenForUser({ id: 2, username: 'nasty' })}`,
      )
      .send({
        name: 'Updated event name',
      })
      .expect(403);
  });

  it('should update an event name', async () => {
    await loadFixtures('1-event-1-user.sql');

    const response = await request(app.getHttpServer())
      .patch('/events/1')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .send({
        name: 'Updated event name',
      })
      .expect(200);

    expect(response.body.name).toBe('Updated event name');
  });

  it('should remove an event', async () => {
    await loadFixtures('1-event-1-user.sql');

    await request(app.getHttpServer())
      .delete('/events/1')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(204);

    await request(app.getHttpServer()).get('/events/1').expect(404);
  });

  it('should throw an error when removing an event of other user', async () => {
    await loadFixtures('1-event-2-users.sql');

    await request(app.getHttpServer())
      .delete('/events/1')
      .set(
        'Authorization',
        `Bearer ${tokenForUser({ id: 2, username: 'nasty' })}`,
      )
      .expect(403);
  });

  it('should throw an error when removing non existing event', async () => {
    await loadFixtures('1-user.sql');

    return request(app.getHttpServer())
      .delete('/events/100')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(404);
  });
});
