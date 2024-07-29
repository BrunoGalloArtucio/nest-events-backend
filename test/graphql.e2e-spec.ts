import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  loadFixtures as loadFixturesBase,
  tokenForUser as tokenForUserBase,
} from './utils';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { User } from 'src/auth/user.entity';
import { ExecutionResult } from 'graphql';
import { PaginatedTeachers } from 'src/school/teacher.entity';

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

describe('GraphQL (e2e)', () => {
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

  describe('teachers query', () => {
    test('should return empty paginated result', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              teachers {
                total
                data {
                  id
                  name
                  gender
                  subjects{
                    id
                    name
                  }
                }
              }
            }`,
        });

      const body = response.body as ExecutionResult<{
        teachers: PaginatedTeachers;
      }>;
      expect(body.data.teachers.data).toEqual([]);
      expect(body.data.teachers.total).toBe(0);
    });

    test('should return paginated result with teachers', async () => {
      await loadFixtures('2-teachers-1-user.sql');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              teachers {
                total
                data {
                  id
                  name
                  gender
                  subjects{
                    id
                    name
                  }
                }
              }
            }`,
        });

      const body = response.body as ExecutionResult<{
        teachers: PaginatedTeachers;
      }>;
      expect(body.data.teachers.total).toBe(2);
      expect(body).toMatchSnapshot();
    });
  });
});
