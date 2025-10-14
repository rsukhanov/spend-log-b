import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';
import { ProcessorService } from './bot/processor/processor.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './db/user/user.service';
import { ExpenseService } from './db/expense/expense.service';
import { UserModule } from './db/user/user.module';
import { ExpenseModule } from './db/expense/expense.module';
import { session } from 'telegraf';
import { WebappModule } from './webapp/webapp.module';
import { CurrencyModule } from './db/currency/currency.module';
import { JwtModule } from '@nestjs/jwt';
import { MainMiddleware } from './general/middleware/main.middleware';
import { PingController } from './ping.controller';


const JWT_SECRET = process.env.JWT_SECRET!
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      middlewares: [session()],
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
  controllers: [PingController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MainMiddleware)
      .forRoutes(
        { path: 'expenses/*path', method: RequestMethod.ALL },
        { path: 'user/*path', method: RequestMethod.ALL },
        { path: 'currency/*path', method: RequestMethod.ALL },
      );
  }
}