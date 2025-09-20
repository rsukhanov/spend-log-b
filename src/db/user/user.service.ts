import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async isRegistered(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    return !!user;
  }

  async registerUser(dto: RegisterUserDto) {
    const userExists = await this.isRegistered(dto.userId);
    if (userExists) {
      throw new Error('User already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        id: dto.userId,
        name: dto.name,
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