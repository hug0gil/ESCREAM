import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSubgenreDto } from './dto/create-subgenre.dto';
import { UpdateSubgenreDto } from './dto/update-subgenre.dto';
import { SubgenresService } from './subgenres.service';

@Controller('subgenres')
export class SubgenresController {
  constructor(private readonly subgenres: SubgenresService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage?: number,
  ) {
    return this.subgenres.findAll(page, perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subgenres.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubgenreDto) {
    return this.subgenres.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubgenreDto,
  ) {
    return this.subgenres.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subgenres.remove(id);
  }

  @Get(':id/movies')
  findWithMovies(@Param('id', ParseIntPipe) id: number) {
    return this.subgenres.findWithMovies(id);
  }

}
