import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOrRegisterUser(dto: RegisterUserDto) {
    let user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: dto.id,
          name: dto.first_name,
          username: dto.username,
        },
      });
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
      },
    });
    return user;
  }

  private async deleteUser(userId: string) {
    const deletedUser = await this.prisma.user.delete({
      where: { id: userId },
    });
    return deletedUser;
  }
}