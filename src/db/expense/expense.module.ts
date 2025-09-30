import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ExpenseController } from './expense.controller';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [PrismaModule, CurrencyModule],
  providers: [ExpenseService],
  exports: [ExpenseService],
  controllers: [ExpenseController]
})
export class ExpenseModule {}
