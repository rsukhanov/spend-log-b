import { Controller, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('currency/:userId/:currency')
  async updateUserCurrency(@Param('userId') userId: string, @Param('currency') currency: string) {
    return this.userService.updateUserCurrency(userId, currency);
  }
}