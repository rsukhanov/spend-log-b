import { EXPENSE_MAIN_CATEGORY, EXPENSE_SUB_CATEGORY, SOURCE_TYPE } from "@prisma/client";
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ExpenseDto {
  @IsDate()
  date: Date;

  @IsNumber()
  amount_original: number;

  @IsString()
  @IsNotEmpty()
  currency_original: string;

  @IsNumber()
  @IsOptional()
  amount_UAH?: number;

  @IsEnum(EXPENSE_MAIN_CATEGORY)
  main_category: EXPENSE_MAIN_CATEGORY;

  @IsEnum(EXPENSE_SUB_CATEGORY)
  sub_category: EXPENSE_SUB_CATEGORY;

  @IsEnum(SOURCE_TYPE)
  source: SOURCE_TYPE;

  @IsString()
  @IsNotEmpty()
  merchant: string;

  @IsString()
  @IsNotEmpty() 
  userId: string;
}