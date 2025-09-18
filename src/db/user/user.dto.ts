import { IsOptional, IsString } from "class-validator";

export class RegisterUserDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  name?: string;
  
  @IsString()
  @IsOptional()
  username?: string;
}