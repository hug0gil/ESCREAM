import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubgenreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
