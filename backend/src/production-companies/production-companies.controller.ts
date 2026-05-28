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
import { CreateProductionCompanyDto } from './dto/create-production-company.dto';
import { ProductionCompaniesService } from './production-companies.service';
import { UpdateProductionCompanyDto } from './dto/update-production-company.dto';

@Controller('production-companies')
export class ProductionCompaniesController {
  constructor(private readonly companies: ProductionCompaniesService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage?: number,
  ) {
    return this.companies.findAll(page, perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companies.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductionCompanyDto) {
    return this.companies.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionCompanyDto,
  ) {
    return this.companies.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companies.remove(id);
  }
}
