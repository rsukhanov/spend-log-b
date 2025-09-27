import { Controller, Post, Body, Get, Head, Headers } from '@nestjs/common';
import { WebappService } from './webapp.service';
import { ok } from 'assert';
import { UserService } from 'src/db/user/user.service';
import { json } from 'stream/consumers';

@Controller('webapp')
export class WebappController {
  constructor(private readonly webappService: WebappService, private readonly userService: UserService) {}

  @Post('verify')
  async verify(@Body('rawInitData') initData: string) {
    const valid = this.webappService.verifyInitData(initData);
    if (valid.ok) {
      try {
        const userData = JSON.parse(valid.data.user);
        userData.id = (userData.id).toString();
        const user = await this.userService.findOrRegisterUser(userData);
        return { ok: true, user };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    } else {
      return valid;
    }    
  }
}



  