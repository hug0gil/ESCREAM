import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Desestructuramos cogiendo value porque si no coge cada param entero con value, key, obj...
// {
//   value: 'ES',                 
//   key: 'countries',            
//   obj: { page:'1', perPage:'2', countries:'ES' }, 
// }

const toArray = ({ value }: { value: unknown }) => {
  if (value == null) return undefined;
  return Array.isArray(value) ? value : [value];
};

export class ListMoviesQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  perPage?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(toArray)
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  subgenreIds?: number[];

  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries?: string[];

  @Transform(toArray)
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  rating?: number[];

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  yearMin?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  yearMax?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  directorId?: number;
}