import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail()
  @MaxLength(255)
  newEmail: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  currentPassword: string;
}
