import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: 'test',
  });

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
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
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new UsersService(prisma as any);
    jest.mocked(bcrypt.hash).mockReset();
  });

  it('paginates users without returning passwords', async () => {
    const users = [{ id: 1, name: 'Hugo', email: 'hugo@example.com' }];
    prisma.user.findMany.mockResolvedValue(users);
    prisma.user.count.mockResolvedValue(11);

    await expect(service.findAll(2, 5)).resolves.toEqual({
      data: users,
      meta: {
        page: 2,
        perPage: 5,
        total: 11,
        lastPage: 3,
      },
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      orderBy: { id: 'asc' },
      omit: { password: true },
    });
  });

  it('hashes passwords when creating a user', async () => {
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    prisma.user.create.mockResolvedValue({
      id: 1,
      name: 'Hugo',
      email: 'hugo@example.com',
    });

    await service.create({
      name: 'Hugo',
      email: 'hugo@example.com',
      password: 'password123',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Hugo',
        email: 'hugo@example.com',
        password: 'hashed-password',
        planId: undefined,
        startDate: undefined,
        endDate: undefined,
        subscribed: undefined,
      },
      omit: { password: true },
    });
  });

  it('maps duplicated emails to ConflictException', async () => {
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    prisma.user.create.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.create({
        name: 'Hugo',
        email: 'taken@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps missing plans to BadRequestException', async () => {
    prisma.user.update.mockRejectedValue(prismaError('P2003'));

    await expect(service.update(1, { planId: 999 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps missing users to NotFoundException on update', async () => {
    prisma.user.update.mockRejectedValue(prismaError('P2025'));

    await expect(service.update(404, { email: 'new@example.com' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
