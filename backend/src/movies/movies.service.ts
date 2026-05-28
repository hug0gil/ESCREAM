import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { ListMoviesQuery } from './dto/list-movies.query';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(opts: ListMoviesQuery) {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 10;
    const skip = (page - 1) * perPage;

    const where = this.buildWhere(opts);

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
        include: {
          director: { select: { id: true, name: true } },
          productionCompany: { select: { id: true, name: true } },
          _count: { select: { reviews: true, actors: true, subgenres: true } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  private buildWhere(opts: ListMoviesQuery): Prisma.MovieWhereInput {
    const where: Prisma.MovieWhereInput = {};
    const and: Prisma.MovieWhereInput[] = [];

    if (opts.search) {
      where.title = { contains: opts.search, mode: 'insensitive' };
    }
    if (opts.directorId !== undefined) {
      where.directorId = opts.directorId;
    }
    if (opts.subgenreIds && opts.subgenreIds.length > 0) {
      where.subgenres = { some: { subgenreId: { in: opts.subgenreIds } } };
    }
    if (opts.countries && opts.countries.length > 0) {
      where.country = { in: opts.countries };
    }
    if (opts.yearMin !== undefined || opts.yearMax !== undefined) {
      where.year = {
        ...(opts.yearMin !== undefined && { gte: opts.yearMin }),
        ...(opts.yearMax !== undefined && { lte: opts.yearMax }),
      };
    }
    if (opts.rating && opts.rating.length > 0) {
      // "rating 4" en el filtro = pelis con 4.0-4.9 → OR de rangos.
      and.push({
        OR: opts.rating.map((r) => ({
          rating: { gte: r, lt: r + 1 },
        })),
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }
    return where;
  }

  async getFacets() {
    const [countryRows, yearAgg, subgenres] = await Promise.all([
      this.prisma.movie.findMany({
        select: { country: true },
        distinct: ['country'],
        orderBy: { country: 'asc' },
      }),
      this.prisma.movie.aggregate({ _min: { year: true }, _max: { year: true } }),
      this.prisma.subgenre.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      countries: countryRows.map((c) => c.country),
      years: {
        min: yearAgg._min.year ?? null,
        max: yearAgg._max.year ?? null,
      },
      subgenres,
    };
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        director: { select: { id: true, name: true } },
        productionCompany: { select: { id: true, name: true } },
        actors: {
          select: { actor: { select: { id: true, name: true } } },
        },
        subgenres: {
          select: {
            subgenre: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!movie) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    return movie;
  }

  async findBySlug(slug: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: {
        director: { select: { id: true, name: true } },
        productionCompany: { select: { id: true, name: true } },
        actors: {
          select: { actor: { select: { id: true, name: true } } },
        },
        subgenres: {
          select: {
            subgenre: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with slug "${slug}" not found`);
    }
    return movie;
  }

  async create(dto: CreateMovieDto) {
    const slug = this.makeSlug(dto.title);
    try {
      return await this.prisma.movie.create({
        data: {
          title: dto.title,
          slug,
          synopsis: dto.synopsis,
          year: dto.year,
          image: dto.image,
          rating: dto.rating,
          directorId: dto.directorId,
          productionCompanyId: dto.productionCompanyId,
          country: dto.country,
          ...(dto.actorIds?.length && {
            actors: {
              createMany: {
                data: dto.actorIds.map((actorId) => ({ actorId })),
              },
            },
          }),
          ...(dto.subgenreIds?.length && {
            subgenres: {
              createMany: {
                data: dto.subgenreIds.map((subgenreId) => ({ subgenreId })),
              },
            },
          }),
        },
        include: {
          director: { select: { id: true, name: true } },
          productionCompany: { select: { id: true, name: true } },
          actors: { select: { actor: { select: { id: true, name: true } } } },
          subgenres: {
            select: { subgenre: { select: { id: true, name: true } } },
          },
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(id: number, dto: UpdateMovieDto) {
    const data: Prisma.MovieUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = this.makeSlug(dto.title);
    }
    if (dto.synopsis !== undefined) data.synopsis = dto.synopsis;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.directorId !== undefined) {
      data.director = { connect: { id: dto.directorId } };
    }
    if (dto.productionCompanyId !== undefined) {
      data.productionCompany = { connect: { id: dto.productionCompanyId } };
    }
    if (dto.actorIds !== undefined) {
      data.actors = {
        deleteMany: {},
        createMany: {
          data: dto.actorIds.map((actorId) => ({ actorId })),
        },
      };
    }
    if (dto.subgenreIds !== undefined) {
      data.subgenres = {
        deleteMany: {},
        createMany: {
          data: dto.subgenreIds.map((subgenreId) => ({ subgenreId })),
        },
      };
    }

    try {
      return await this.prisma.movie.update({
        where: { id },
        data,
        include: {
          director: { select: { id: true, name: true } },
          productionCompany: { select: { id: true, name: true } },
          actors: { select: { actor: { select: { id: true, name: true } } } },
          subgenres: {
            select: { subgenre: { select: { id: true, name: true } } },
          },
        },
      });
    } catch (e) {
      this.handlePrismaError(e, id);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.movie.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Movie ${id} not found`);
      }
      throw e;
    }
  }

  private makeSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }

  private handlePrismaError(e: unknown, id?: number): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          'A movie with that title/slug already exists',
        );
      }
      if (e.code === 'P2003') {
        throw new BadRequestException(
          'Director, production company, actor, or subgenre does not exist',
        );
      }
      if (e.code === 'P2025') {
        throw new NotFoundException(`Movie ${id} not found`);
      }
    }
    throw e;
  }
}
