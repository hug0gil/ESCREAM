import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Injectable()
export class DirectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.director.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.director.count(),
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

  async findOne(id: number) {
    const director = await this.prisma.director.findUnique({ where: { id } });
    if (!director) {
      throw new NotFoundException(`Director ${id} not found`);
    }
    return director;
  }

  async create(dto: CreateDirectorDto) {
    return this.prisma.director.create({
      data: {
        name: dto.name,
        birthDate: dto.birthDate,
      },
    });
  }

  async update(id: number, dto: UpdateDirectorDto) {
    try {
      return await this.prisma.director.update({
        where: { id },
        data: { ...dto },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Director ${id} not found`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.director.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Director ${id} not found`);
      }
      throw e;
    }
  }
}
