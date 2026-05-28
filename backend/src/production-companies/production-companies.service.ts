import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductionCompanyDto } from './dto/create-production-company.dto';
import { UpdateProductionCompanyDto } from './dto/update-production-company.dto';

@Injectable()
export class ProductionCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.productionCompany.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.productionCompany.count(),
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
    const company = await this.prisma.productionCompany.findUnique({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException(`Production company ${id} not found`);
    }
    return company;
  }

  async create(dto: CreateProductionCompanyDto) {
    return this.prisma.productionCompany.create({ data: { ...dto } });
  }

  async update(id: number, dto: UpdateProductionCompanyDto) {
    try {
      return await this.prisma.productionCompany.update({
        where: { id },
        data: { ...dto },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Production company ${id} not found`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.productionCompany.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Production company ${id} not found`);
      }
      throw e;
    }
  }
}
