import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseDto } from './utils/createExpense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

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
}