import { IsOptional, IsString } from "class-validator";

export class RegisterUserDto {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  first_name?: string;
  
  @IsString()
  @IsOptional()
  username?: string;
}
