import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProfilesService } from './profiles.service';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: 'test',
  });

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: {
    profile: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      profile: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new ProfilesService(prisma as any);
  });

  it('filters profiles by user when userId is provided', async () => {
    const profiles = [{ id: 1, profileName: 'Hugo', ageRestriction: 18, userId: 7 }];
    prisma.profile.findMany.mockResolvedValue(profiles);
    prisma.profile.count.mockResolvedValue(1);

    await expect(service.findAll(1, 10, 7)).resolves.toEqual({
      data: profiles,
      meta: {
        page: 1,
        perPage: 10,
        total: 1,
        lastPage: 1,
      },
    });

    expect(prisma.profile.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      skip: 0,
      take: 10,
      orderBy: { id: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    expect(prisma.profile.count).toHaveBeenCalledWith({ where: { userId: 7 } });
  });

  it('throws NotFoundException when a profile does not exist', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps invalid user relation to BadRequestException on create', async () => {
    prisma.profile.create.mockRejectedValue(prismaError('P2003'));

    await expect(
      service.create({
        profileName: 'Hugo',
        ageRestriction: 18,
        userId: 404,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps missing profiles to NotFoundException on update', async () => {
    prisma.profile.update.mockRejectedValue(prismaError('P2025'));

    await expect(service.update(404, { profileName: 'Nuevo' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
