import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { ExpenseModule } from 'src/db/expense/expense.module';
import { UserModule } from 'src/db/user/user.module';
import { BotUpdate } from './bot.update';

@Module({
  imports: [TelegrafModule, UserModule, ExpenseModule],
  providers: [BotService, ProcessorService, BotUpdate],
})
export class BotModule {}
