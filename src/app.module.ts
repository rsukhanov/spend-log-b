import { Module } from '@nestjs/common';
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


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      middlewares: [session()],
    }),
    BotModule,
    PrismaModule,
    UserModule,
    ExpenseModule,
  ],
  controllers: [],
  providers: [ProcessorService],
})
export class AppModule {}
