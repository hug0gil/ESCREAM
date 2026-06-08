import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  profileName: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction: number;

  @IsInt()
  @Min(1)
  userId: number;
}
