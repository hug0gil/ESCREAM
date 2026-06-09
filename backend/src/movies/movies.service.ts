import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(MoviesService.name);
  private readonly tmdbUrl = 'https://api.themoviedb.org/3/search/movie';
  private readonly posterBase = 'https://image.tmdb.org/t/p/w500';

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Lista películas paginadas para la vista pública y el panel de administración.
   * Combina los filtros recibidos en query params con una consulta de datos y otra
   * de conteo total para devolver metadatos de paginación consistentes.
   */
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

  /**
   * Traduce el DTO de filtros HTTP a un `MovieWhereInput` de Prisma.
   * Mantiene aquí la lógica de composición para que `findAll` solo tenga que
   * preocuparse de paginar y seleccionar relaciones.
   */
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
      where.rating = { in: opts.rating };
    }

    return where;
  }

  /**
   * Devuelve los valores necesarios para construir filtros en frontend:
   * países disponibles, rango global de años y subgéneros ordenados.
   */
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

  /**
   * Busca una película por id con las relaciones que necesita el detalle/admin.
   * Lanza 404 explícito para que el controlador no devuelva `null` silencioso.
   */
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

  /**
   * Busca una película por slug, que es el identificador usado en las rutas
   * públicas. Incluye las mismas relaciones que `findOne` para mantener shapes
   * de respuesta equivalentes.
   */
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

  /**
   * Crea una película y sus relaciones many-to-many iniciales.
   */
  async create(dto: CreateMovieDto) {
    const slug = this.makeSlug(dto.title);
    try {
      const movie = await this.prisma.movie.create({
        data: {
          title: dto.title,
          slug,
          synopsis: dto.synopsis || '',
          year: dto.year,
          image: dto.image,
          movieUrl: dto.movieUrl,
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
      this.logger.log({
        msg: 'Movie created',
        movieId: movie.id,
        title: movie.title,
        slug: movie.slug,
      });
      return movie;
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  /**
   * Rellena imágenes pendientes replicando la estrategia de `prisma/seed-images.ts`.
   * Solo procesa películas cuyo `image` está vacío o en null y devuelve un resumen
   * para que el panel admin pueda mostrar feedback al usuario.
   */
  async seedMissingImages() {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('TMDB_API_KEY is not configured');
    }

    const movies = await this.prisma.movie.findMany({
      where: {
        OR: [{ image: null }, { image: '' }],
      },
      include: { director: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });

    let updated = 0;
    let skipped = 0;
    const failed: { id: number; title: string }[] = [];

    for (const movie of movies) {
      try {
        const chosen = await this.findTmdbMatch(movie, apiKey);
        if (!chosen?.poster_path) {
          skipped += 1;
          continue;
        }

        await this.prisma.movie.update({
          where: { id: movie.id },
          data: { image: `${this.posterBase}${chosen.poster_path}` },
        });
        updated += 1;
      } catch (e) {
        this.logger.warn(`Could not seed image for movie ${movie.id}: ${String(e)}`);
        failed.push({ id: movie.id, title: movie.title });
      }
    }

    this.logger.log({
      msg: 'Movie images seeded',
      processed: movies.length,
      updated,
      skipped,
      failed: failed.length,
    });

    return {
      processed: movies.length,
      updated,
      skipped,
      failed,
    };
  }

  /**
   * Actualiza parcialmente una película.
   * Para relaciones many-to-many se reemplaza el conjunto completo cuando el DTO
   * trae `actorIds` o `subgenreIds`, que encaja con el formulario admin actual.
   */
  async update(id: number, dto: UpdateMovieDto) {
    const data: Prisma.MovieUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = this.makeSlug(dto.title);
    }
    if (dto.synopsis !== undefined) data.synopsis = dto.synopsis;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.movieUrl !== undefined) data.movieUrl = dto.movieUrl;
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
      const movie = await this.prisma.movie.update({
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
      this.logger.log({
        msg: 'Movie updated',
        movieId: movie.id,
        title: movie.title,
        fields: Object.keys(data),
      });
      return movie;
    } catch (e) {
      this.handlePrismaError(e, id);
    }
  }

  /**
   * Elimina una película por id.
   * Prisma reporta P2025 cuando no existe el registro; aquí se convierte a un
   * 404 propio de la API.
   */
  async remove(id: number) {
    try {
      await this.prisma.movie.delete({ where: { id } });
      this.logger.log({ msg: 'Movie deleted', movieId: id });
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

  /**
   * Genera slugs estables a partir del título usando solo caracteres seguros
   * para URL. Se llama tanto al crear como al renombrar una película.
   */
  private makeSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }

  /**
   * Busca el mejor candidato en TMDB para una película local.
   * La prioridad favorece director, título+año, título, año y por último el
   * primer resultado, replicando la estrategia que antes vivía en `seed-images`.
   */
  private async findTmdbMatch(
    movie: {
      title: string;
      year: number | null;
      director?: { name: string } | null;
    },
    apiKey: string,
  ) {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: movie.title,
      year: movie.year ? String(movie.year) : '',
      language: 'es-ES',
    });

    const res = await fetch(`${this.tmdbUrl}?${params.toString()}`);
    if (!res.ok) {
      this.logger.warn(`TMDB search failed for "${movie.title}" with HTTP ${res.status}`);
      return undefined;
    }

    const data: {
      results?: {
        id?: number;
        title?: string;
        overview?: string;
        release_date?: string;
        poster_path?: string | null;
      }[];
    } = await res.json();

    const results = data.results ?? [];
    const year = movie.year ? String(movie.year) : undefined;
    const title = movie.title.toLowerCase();

    let byDirector: (typeof results)[number] | undefined;
    if (movie.director?.name) {
      const directorName = movie.director.name.toLowerCase();
      for (const result of results) {
        if (!result.id) continue;
        const director = await this.getTmdbDirector(result.id, apiKey);
        if (director?.toLowerCase() === directorName) {
          byDirector = result;
          break;
        }
      }
    }

    const byBoth = results.find(
      (result) =>
        result.title?.toLowerCase() === title &&
        (!year || result.release_date?.slice(0, 4) === year),
    );
    const byTitle = results.find((result) => result.title?.toLowerCase() === title);
    const byYear = year
      ? results.find((result) => result.release_date?.slice(0, 4) === year)
      : undefined;

    return byDirector ?? byBoth ?? byTitle ?? byYear ?? results[0];
  }

  /**
   * Consulta los créditos de TMDB para obtener el director de un resultado.
   * `search/movie` no incluye esta información, pero ayuda a desambiguar
   * películas con títulos repetidos o años ligeramente distintos.
   */
  private async getTmdbDirector(
    movieId: number,
    apiKey: string,
  ): Promise<string | undefined> {
    const params = new URLSearchParams({ api_key: apiKey, language: 'es-ES' });
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?${params.toString()}`,
    );
    if (!res.ok) return undefined;

    const data: { crew?: { job?: string; name?: string }[] } = await res.json();
    return data.crew?.find((crew) => crew.job === 'Director')?.name;
  }

  /**
   * Centraliza la traducción de errores conocidos de Prisma a excepciones HTTP.
   * Así `create` y `update` comparten mensajes y códigos coherentes.
   */
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
