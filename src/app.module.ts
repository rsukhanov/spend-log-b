import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './db/user/user.module';
import { ExpenseModule } from './db/expense/expense.module';
import { WebappModule } from './webapp/webapp.module';
import { CurrencyModule } from './db/currency/currency.module';
import { JwtModule } from '@nestjs/jwt';
import { PingController } from './ping.controller';
import { MainMiddleware } from './general/middleware/main.middleware';
import { LoggerMiddleware } from './general/middleware/logger.middleware';
import { TelegrafWebhookController } from './telegraf-webhook.controller';

const JWT_SECRET = process.env.JWT_SECRET!
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { 
        expiresIn: '24h',
        algorithm: 'HS256'
      },
      global: true,
    }),
    BotModule,
    PrismaModule,
    UserModule,
    ExpenseModule,
    WebappModule,
    CurrencyModule,
  ],
  controllers: [PingController, TelegrafWebhookController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer
    //   .apply(LoggerMiddleware)
    //   .forRoutes('*');
    consumer
      .apply(MainMiddleware)
      .exclude('telegraf')
      .forRoutes(
        { path: 'expenses/*path', method: RequestMethod.ALL },
        { path: 'user/*path', method: RequestMethod.ALL },
        { path: 'currency/*path', method: RequestMethod.ALL },
      );
  }
}