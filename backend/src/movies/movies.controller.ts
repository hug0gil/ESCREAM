import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import { ListMoviesQuery } from './dto/list-movies.query';
import { MoviesService } from './movies.service';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  findAll(@Query() query: ListMoviesQuery) {
    return this.movies.findAll(query);
  }

  @Get('facets')
  facets() {
    return this.movies.getFacets();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.movies.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movies.findOne(id);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMovieDto) {
    return this.movies.create(dto);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movies.update(id, dto);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movies.remove(id);
  }
}
