import { IsDate, IsDateString, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateDirectorDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsDateString()
    @IsNotEmpty()
    birthDate: Date;
}
