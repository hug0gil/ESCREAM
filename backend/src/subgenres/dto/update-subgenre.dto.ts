import { PartialType } from '@nestjs/mapped-types';
import { CreateSubgenreDto } from './create-subgenre.dto';

export class UpdateSubgenreDto extends PartialType(CreateSubgenreDto) {}
