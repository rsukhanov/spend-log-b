import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from './utils/createExpense.dto';
import { User } from 'src/general/decorators/user.decorator';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get(':preferred_currency')
  async getById(
    @User('id') userId: string, 
    @Param('preferred_currency') preferred_currency: string) 
  {
    await this.expenseService.updateExpensesWithOutPreferredCurrency(userId, preferred_currency);
    return await this.expenseService.getUserExpenses(userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: Partial<ExpenseDto>) 
  {
    return await this.expenseService.changeExpense(id, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string) 
  {
    return await this.expenseService.deleteExpense(id);
  }

  @Patch(':currency')
  async updateCurrency(
    @User('id') userId: string, 
    @Param('currency') currency: string) 
  {
    return await this.expenseService.updateAllExpensesWithPreferredCurrency(userId, currency);
  }
}