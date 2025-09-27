import { Module } from '@nestjs/common';
import { WebappService } from './webapp.service';
import { WebappController } from './webapp.controller';
import { UserService } from 'src/db/user/user.service';
import { UserModule } from 'src/db/user/user.module';

@Module({
  controllers: [WebappController],
  providers: [WebappService],
  imports: [UserModule],
})
export class WebappModule {}
