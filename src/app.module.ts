import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { ConfigModule } from '@nestjs/config';
import { AppJapanService } from './app.japan.service';
import { AppDummy } from './app.dummy';
import ormConfig from './config/orm.config';
import ormConfigProd from './config/orm.config.prod';
import { SchoolModule } from './school/school.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
      /**
       * Allows referencing other env variables within the same env file:
       *    APP_URL=mywebsite.com
       *    SUPPORT_EMAIL=support@${APP_URL}
       */
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory:
        process.env.NODE_ENV !== 'production' ? ormConfig : ormConfigProd,
    }),
    EventsModule,
    SchoolModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useClass: AppJapanService,
    },
    {
      provide: 'APP_NAME',
      useValue: 'Nest Events Backend!',
    },
    {
      provide: 'MESSAGE',
      inject: [AppDummy],
      useFactory: (appDummy: AppDummy) => appDummy.dummy(),
    },
    AppDummy,
  ],
})
export class AppModule {}
