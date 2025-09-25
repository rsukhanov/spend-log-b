import { EXPENSE_MAIN_CATEGORY, EXPENSE_SUB_CATEGORY, SOURCE_TYPE } from "@prisma/client"; 

export class ExpenseDto {
  date: Date;

  amount_original: number;
  currency_original: string;

  amount_UAH?: number;

  main_category: EXPENSE_MAIN_CATEGORY;
  sub_category: EXPENSE_SUB_CATEGORY;

  source: SOURCE_TYPE;

  merchant: string;

  userId: string;
}