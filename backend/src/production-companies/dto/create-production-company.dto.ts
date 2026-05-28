import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductionCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;
}
