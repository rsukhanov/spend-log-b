import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseDto } from './utils/createExpense.dto';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService, private currency: CurrencyService) {}

  async createExpense(dto: ExpenseDto) {
    return await this.prisma.expense.create({
      data: dto
    });
  }

  async createManyExpenses(dto: ExpenseDto[]){
    return await this.prisma.expense.createMany({
      data: dto
    })
  }

  async changeExpense(id: string, dto: Partial<ExpenseDto>) {
    return await this.prisma.expense.update({
      where: {id},
      data: dto
    })
  }

  async isExistExpense(userId: string){
    const expense = await this.prisma.expense.findFirst({
      where: { userId: userId },
    })
    return !!expense;
  }


  async getUserExpenses(userId: string) {
    return await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async deleteExpense(id: string){
    return await this.prisma.expense.delete({
      where: {id}
    })
  }

  async clearUserExpenses(userId: string){
    await this.prisma.expense.deleteMany({
      where: { userId },
    });
  }

  async updateAllExpensesWithPreferredCurrency(userId: string, preferred_currency: string){
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
    });

    if (!expenses || expenses.length === 0) return;

    for (const expense of expenses) {
      if (expense.currency_original === preferred_currency) {
        await this.prisma.expense.update({
          where: { id: expense.id },
          data: { amount_in_preferred_currency: expense.amount_original },
        });
      } else {
        
        const convertedAmount = await this.currency.convertCurrency(
          expense.amount_original,
          expense.currency_original,
          preferred_currency
        );

        await this.prisma.expense.update({
          where: { id: expense.id },
          data: { amount_in_preferred_currency: convertedAmount },
        });
      }
    }
  }

  async updateExpensesWithOutPreferredCurrency(userId: string, preferred_currency: string){
    const expenses = await this.prisma.expense.findMany({
      where: { 
        userId, 
        amount_in_preferred_currency: undefined},
    });
    if (!expenses || expenses.length === 0) return;

    for (const expense of expenses) {  
      const convertedAmount = await this.currency.convertCurrency(
        expense.amount_original,
        expense.currency_original,
        preferred_currency
      );

      await this.prisma.expense.update({
        where: { id: expense.id },
        data: { amount_in_preferred_currency: convertedAmount },
      });
    }
  }
}