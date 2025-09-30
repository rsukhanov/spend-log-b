import { Controller, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { ExpenseService } from "../expense/expense.service";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly expenseService: ExpenseService) {}

  @Patch('currency/:userId/:currency')
  async updateUserCurrency(@Param('userId') userId: string, @Param('currency') currency: string) {
    await this.expenseService.updateAllExpensesWithPreferredCurrency(userId, currency);
    const res = await this.userService.updateUserCurrency(userId, currency);
    return res;
  }
}