import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.plan.count(),
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
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
    return plan;
  }

  async create(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: { ...dto } });
  }

  async update(id: number, dto: UpdatePlanDto) {
    try {
      return await this.prisma.plan.update({
        where: { id },
        data: { ...dto },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Plan ${id} not found`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.plan.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`Plan ${id} not found`);
        }
        if (e.code === 'P2003') {
          throw new NotFoundException(
            `Cannot delete plan ${id}: users are still subscribed to it`,
          );
        }
      }
      throw e;
    }
  }
}
