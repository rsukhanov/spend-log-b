import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateUserCurrency(userId: string, currency: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { preferred_currency: currency },
    });
  }

  async findUpdateOrRegisterUser(dto: RegisterUserDto) {
    let user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      user = await this.registerUser(dto);
    }
    if(!Object.assign(user, dto)){
      user = await this.updateUser(dto.id, dto);
    }
    return user;
  }

  async isRegistered(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    return !!user;
  }

  async registerUser(dto: RegisterUserDto) {
    const user = await this.prisma.user.create({
      data: {
        id: dto.id,
        name: dto.first_name,
        username: dto.username,
        photo_url: dto.photo_url,
      },
    });
    return user;
  }

  async updateUser(userId: string, dto: Partial<RegisterUserDto>) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return updatedUser;
  }

  private async deleteUser(userId: string) {
    const deletedUser = await this.prisma.user.delete({
      where: { id: userId },
    });
    return deletedUser;
  }
}