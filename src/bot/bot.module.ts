import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { ExpenseModule } from 'src/db/expense/expense.module';
import { UserModule } from 'src/db/user/user.module';

@Module({
  imports: [TelegrafModule, UserModule, ExpenseModule],
  providers: [BotService, ProcessorService],
})
export class BotModule {}
