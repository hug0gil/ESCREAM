import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  synopsis?: string;

  @IsInt()
  @Min(1800)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  movieUrl?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsInt()
  @Min(1)
  directorId: number;

  @IsInt()
  @Min(1)
  productionCompanyId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  @IsOptional()
  actorIds?: number[];

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  @IsOptional()
  subgenreIds?: number[];
}
