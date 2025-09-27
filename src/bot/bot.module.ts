import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { ExpenseService } from 'src/db/expense/expense.service';
import { UserModule } from 'src/db/user/user.module';
import { UserService } from 'src/db/user/user.service';
import { ExpenseModule } from 'src/db/expense/expense.module';

@Module({
  imports: [UserModule, ExpenseModule],
  providers: [BotService, ProcessorService],
})
export class BotModule {}
