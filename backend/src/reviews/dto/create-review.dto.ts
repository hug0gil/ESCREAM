import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsInt()
  @Min(1)
  movieId: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(9.9)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
