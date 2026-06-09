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
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    verificationToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mail: { sendVerificationEmail: jest.Mock };
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
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      verificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    mail = { sendVerificationEmail: jest.fn() };

    service = new AuthService(
      users as any,
      jwt as any,
      prisma as any,
      mail as any,
    );
    jest.mocked(bcrypt.compare).mockReset(); // se resetea para que no interfiera el valor que aplicamos con mockResolvedValue
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('registers a user and sends a verification email', async () => {
    const user = {
      id: 1,
      email: 'hugo@example.com',
      role: Role.USER,
    };
    users.create.mockResolvedValue(user);
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.verificationToken.create.mockResolvedValue({});

    await expect(
      service.register({
        name: 'Hugo',
        email: 'hugo@example.com',
        password: 'password123',
      }),
    ).resolves.toEqual({
      user,
      message: 'User registered. Check your email to verify the account.',
    });

    expect(users.create).toHaveBeenCalledWith({
      name: 'Hugo',
      email: 'hugo@example.com',
      password: 'password123',
    });
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        type: 'EMAIL_VERIFICATION',
        newEmail: undefined,
        expiresAt: expect.any(Date),
        tokenHash: expect.any(String),
      },
    });
    expect(mail.sendVerificationEmail).toHaveBeenCalledWith(
      'hugo@example.com',
      expect.any(String),
    );
    expect(jwt.sign).not.toHaveBeenCalled();
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
      emailVerifiedAt: new Date(),
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
      emailVerifiedAt: new Date(),
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

  it('changes the current user plan and renews the subscription', async () => {
    users.update.mockResolvedValue({
      id: 1,
      name: 'Hugo',
      email: 'hugo@example.com',
      role: Role.USER,
      subscribed: true,
      planId: 2,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-02-01T00:00:00.000Z'),
    });

    const result = await service.changeSubscription(1, { planId: 2 });

    expect(result.planId).toBe(2);
    expect(users.update).toHaveBeenCalledWith(1, {
      planId: 2,
      startDate: expect.any(String),
      endDate: expect.any(String),
      subscribed: true,
    });
  });

  it('confirms an email change and returns the updated user', async () => {
    const updatedUser = {
      id: 1,
      name: 'Hugo',
      email: 'nuevo@example.com',
      role: Role.USER,
      subscribed: true,
      planId: 1,
      emailVerifiedAt: new Date(),
    };
    prisma.verificationToken.findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      type: 'EMAIL_CHANGE',
      newEmail: 'nuevo@example.com',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue(updatedUser);
    prisma.verificationToken.update.mockResolvedValue({ id: 10 });
    prisma.$transaction.mockResolvedValue([updatedUser, { id: 10 }]);

    await expect(
      service.confirmEmailChange({ token: 'valid-token' }),
    ).resolves.toEqual({
      message: 'Email changed successfully.',
      user: updatedUser,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        email: 'nuevo@example.com',
        emailVerifiedAt: expect.any(Date),
      },
      omit: { password: true },
    });
  });
});
