import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Injectable()
export class ActorsService {
  private readonly logger = new Logger(ActorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.actor.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.actor.count(),
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
    const actor = await this.prisma.actor.findUnique({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor ${id} not found`);
    }
    return actor;
  }

  async create(dto: CreateActorDto) {
    const actor = await this.prisma.actor.create({ data: { ...dto } });
    this.logger.log({ msg: 'Actor created', actorId: actor.id, name: actor.name });
    return actor;
  }

  async update(id: number, dto: UpdateActorDto) {
    try {
      const actor = await this.prisma.actor.update({
        where: { id },
        data: { ...dto },
      });
      this.logger.log({
        msg: 'Actor updated',
        actorId: actor.id,
        fields: Object.keys(dto),
      });
      return actor;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Actor ${id} not found`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.actor.delete({ where: { id } });
      this.logger.log({ msg: 'Actor deleted', actorId: id });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Actor ${id} not found`);
      }
      throw e;
    }
  }
}
