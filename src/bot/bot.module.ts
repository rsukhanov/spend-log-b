import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { ExpenseModule } from 'src/db/expense/expense.module';
import { UserModule } from 'src/db/user/user.module';

@Module({
  imports: [UserModule, ExpenseModule],
  providers: [BotService, ProcessorService],
  exports: [BotService],
})
export class BotModule {}
