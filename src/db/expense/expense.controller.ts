import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from './utils/createExpense.dto';
import path from 'path';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.expenseService.getUserExpenses(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<ExpenseDto>) {
    return await this.expenseService.changeExpense(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.expenseService.deleteExpense(id);
  }

  @Patch(':userId/:currency')
  async updateCurrency(@Param('userId') userId: string, @Param('currency') currency: string) {
    return await this.expenseService.updateAllExpensesWithPreferredCurrency(userId, currency);
  }

}
