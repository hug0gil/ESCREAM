import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Injectable()
export class DirectorsService {
  private readonly logger = new Logger(DirectorsService.name);

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
    const director = await this.prisma.director.create({
      data: {
        name: dto.name,
        birthDate: dto.birthDate,
      },
    });
    this.logger.log({
      msg: 'Director created',
      directorId: director.id,
      name: director.name,
    });
    return director;
  }

  async update(id: number, dto: UpdateDirectorDto) {
    try {
      const director = await this.prisma.director.update({
        where: { id },
        data: { ...dto },
      });
      this.logger.log({
        msg: 'Director updated',
        directorId: director.id,
        fields: Object.keys(dto),
      });
      return director;
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
      this.logger.log({ msg: 'Director deleted', directorId: id });
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
