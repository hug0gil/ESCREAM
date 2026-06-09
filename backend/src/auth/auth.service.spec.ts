import { Logger, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

// se mockea para que no haga el cifrado realmente
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let users: {
    create: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    update: jest.Mock;
  };
  let jwt: { sign: jest.Mock };
  let prisma: { user: { update: jest.Mock } };
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(); // silenciar los logs durante los tests
    users = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      update: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-token') };
    prisma = {
      user: {
        update: jest.fn(),
      },
    };

    service = new AuthService(users as any, jwt as any, prisma as any);
    jest.mocked(bcrypt.compare).mockReset(); // se resetea para que no interfiera el valor que aplicamos con mockResolvedValue
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('registers a user and returns a signed token', async () => {
    const user = {
      id: 1,
      email: 'hugo@example.com',
      role: Role.USER,
    };
    users.create.mockResolvedValue(user);

    await expect(
      service.register({
        name: 'Hugo',
        email: 'hugo@example.com',
        password: 'password123',
      }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      user,
    });

    expect(users.create).toHaveBeenCalledWith({
      name: 'Hugo',
      email: 'hugo@example.com',
      password: 'password123',
    });
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'hugo@example.com',
      role: Role.USER,
    });
  });

  it('rejects login when the user does not exist', async () => {
    users.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when the password is invalid', async () => {
    users.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'hugo@example.com',
      password: 'hashed',
      role: Role.USER,
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({ email: 'hugo@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('activates subscription and omits password on successful login', async () => {
    const user = {
      id: 1,
      name: 'Hugo',
      email: 'hugo@example.com',
      password: 'hashed',
      role: Role.USER,
      subscribed: false,
    };
    users.findByEmailWithPassword.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    prisma.user.update.mockResolvedValue({
      ...user,
      subscribed: true,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-02-01T00:00:00.000Z'),
    });

    const result = await service.login({
      email: 'hugo@example.com',
      password: 'password123',
    });

    expect(result.access_token).toBe('signed-token');
    expect(result.user).not.toHaveProperty('password'); // comprobar que no se devuelve la password
    expect(result.user.subscribed).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        subscribed: true,
      },
    });
  });
});
