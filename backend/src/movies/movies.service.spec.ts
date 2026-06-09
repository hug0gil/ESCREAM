import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MoviesService } from './movies.service';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: 'test',
  });

describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: {
    movie: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      aggregate: jest.Mock;
    };
    subgenre: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      movie: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      subgenre: {
        findMany: jest.fn(),
      },
    };

    service = new MoviesService(prisma as any);
  });

  it('builds filters and pagination for findAll', async () => {
    const movies = [{ id: 1, title: 'Scream' }];
    prisma.movie.findMany.mockResolvedValue(movies);  // cuando el servicio llame a findMany, recibirá esto
    prisma.movie.count.mockResolvedValue(12);          // cuando llame a count, recibirá 12

    // await + expect esperamos la promise y resolve con el valor que devuelve
    await expect(
      service.findAll({
        page: 2,
        perPage: 5,
        search: 'scream',
        directorId: 3,
        subgenreIds: [1, 2],
        countries: ['US'],
        yearMin: 1990,
        yearMax: 2000,
        rating: [4],
      }),
    ).resolves.toEqual({
      data: movies,
      meta: {
        page: 2,
        perPage: 5,
        total: 12,
        lastPage: 3,
      },
    });

    const where = {
      title: { contains: 'scream', mode: 'insensitive' },
      directorId: 3,
      subgenres: { some: { subgenreId: { in: [1, 2] } } },
      country: { in: ['US'] },
      year: { gte: 1990, lte: 2000 },
      rating: { in: [4] },
    };


    // comprobamos que la estructura de parámetros en los métodos es la correcta
    expect(prisma.movie.findMany).toHaveBeenCalledWith({
      where,
      skip: 5,
      take: 5,
      orderBy: { id: 'asc' },
      include: {
        director: { select: { id: true, name: true } },
        productionCompany: { select: { id: true, name: true } },
        _count: { select: { reviews: true, actors: true, subgenres: true } },
      },
    });
    expect(prisma.movie.count).toHaveBeenCalledWith({ where });
  });

  it('returns facets with countries, year range and subgenres', async () => {
    prisma.movie.findMany.mockResolvedValue([{ country: 'ES' }, { country: 'US' }]);
    prisma.movie.aggregate.mockResolvedValue({
      _min: { year: 1978 },
      _max: { year: 2026 },
    });
    prisma.subgenre.findMany.mockResolvedValue([{ id: 1, name: 'Slasher', slug: 'slasher' }]);

    await expect(service.getFacets()).resolves.toEqual({
      countries: ['ES', 'US'],
      years: { min: 1978, max: 2026 },
      subgenres: [{ id: 1, name: 'Slasher', slug: 'slasher' }],
    });
  });

  it('throws NotFoundException when a movie does not exist', async () => {
    prisma.movie.findUnique.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a movie with slug and many-to-many relations', async () => {
    prisma.movie.create.mockResolvedValue({ id: 1, title: 'The Thing', slug: 'the-thing' });

    await service.create({
      title: 'The Thing',
      directorId: 1,
      productionCompanyId: 2,
      country: 'US',
      actorIds: [3, 4],
      subgenreIds: [5],
    });

    expect(prisma.movie.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'The Thing',
          slug: 'the-thing',
          directorId: 1,
          productionCompanyId: 2,
          country: 'US',
          actors: {
            createMany: {
              data: [{ actorId: 3 }, { actorId: 4 }],
            },
          },
          subgenres: {
            createMany: {
              data: [{ subgenreId: 5 }],
            },
          },
        }),
      }),
    );
  });

  it('maps duplicated movie slugs to ConflictException', async () => {
    prisma.movie.create.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.create({
        title: 'Scream',
        directorId: 1,
        productionCompanyId: 2,
        country: 'US',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps missing relations to BadRequestException', async () => {
    prisma.movie.update.mockRejectedValue(prismaError('P2003'));

    await expect(service.update(1, { directorId: 404 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
