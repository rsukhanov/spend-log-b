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
        const user = await this.userService.findUpdateOrRegisterUser(userData);
        return { ok: true, user };
  // id: '689032392',
  // name: 'Рома',
  // username: 'rsukhanov',
  // photo_url: 'https://t.me/i/userpic/320/RgrJRSwPtwzXVa0G0eRMrnP0VJlp05JD9YxFqo_6sRQ.svg',
  // preferred_currency: null,
  // first_name: 'Рома',
  // last_name: '',
  // language_code: 'ru',
  // allows_write_to_pm: true
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    } else {
      return valid;
    }    
  }
}



  