import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from './utils/createExpense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.expenseService.getUserExpenses(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<ExpenseDto>) {
    return this.expenseService.changeExpense(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expenseService.deleteExpense(id);
  }
}
