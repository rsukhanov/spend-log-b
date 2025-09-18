import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async isExistExpense(userId: string){
    const expense = await this.prisma.expense.findFirst({
      where: { userId: userId },
    })
    return !!expense;
  }

  async clearUserExpenses(userId: string){
    await this.prisma.expense.deleteMany({
      where: { userId },
    });
  }
}