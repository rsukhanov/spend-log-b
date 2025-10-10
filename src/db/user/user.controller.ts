import { Controller, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { ExpenseService } from "../expense/expense.service";
import { User } from "src/general/decorators/user.decorator";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly expenseService: ExpenseService) {}

  @Patch('currency/:currency')
  async updateUserCurrency(
    @User('id') userId: string, 
    @Param('currency') currency: string) 
  {
    await this.expenseService.updateAllExpensesWithPreferredCurrency(userId, currency);
    const res = await this.userService.updateUserCurrency(userId, currency);
    return res;
  }
}