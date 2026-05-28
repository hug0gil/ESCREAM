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

  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction: number;

  @IsInt()
  @Min(1)
  userId: number;
}
