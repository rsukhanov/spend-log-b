import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
