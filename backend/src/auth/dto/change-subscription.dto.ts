import { IsIn, IsInt } from 'class-validator';

export class ChangeSubscriptionDto {
  @IsInt()
  @IsIn([1, 2, 3])
  planId: number;
}
