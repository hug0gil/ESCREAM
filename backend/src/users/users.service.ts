import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
        omit: { password: true },
      }),
      this.prisma.user.count(),
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

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: passwordHash,
          planId: dto.planId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          subscribed: dto.subscribed,
        },
        omit: { password: true },
      });
      this.logger.log({
        msg: 'User created',
        userId: user.id,
        email: user.email,
        planId: user.planId,
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
        if (e.code === 'P2003') {
          throw new BadRequestException('Plan does not exist');
        }
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.planId !== undefined) {
      data.plan = { connect: { id: dto.planId } };
    }
    if (dto.startDate !== undefined) data.startDate = dto.startDate;
    if (dto.endDate !== undefined) data.endDate = dto.endDate;
    if (dto.subscribed !== undefined) data.subscribed = dto.subscribed;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        omit: { password: true },
      });
      this.logger.log({
        msg: 'User updated',
        userId: user.id,
        fields: Object.keys(data),
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`User ${id} not found`);
        }
        if (e.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
        if (e.code === 'P2003') {
          throw new BadRequestException('Plan does not exist');
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      this.logger.log({ msg: 'User deleted', userId: id });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`User ${id} not found`);
      }
      throw e;
    }
  }
}
