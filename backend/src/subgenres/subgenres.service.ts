import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubgenreDto } from './dto/create-subgenre.dto';
import { UpdateSubgenreDto } from './dto/update-subgenre.dto';

@Injectable()
export class SubgenresService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(page = 1, perPage = 6) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.subgenre.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.subgenre.count(),
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
    const subgenre = await this.prisma.subgenre.findUnique({ where: { id } });
    if (!subgenre) {
      throw new NotFoundException(`Subgenre ${id} not found`);
    }
    return subgenre;
  }

  async create(dto: CreateSubgenreDto) {
    try {
      return await this.prisma.subgenre.create({
        data: {
          name: dto.name,
          description: dto.description,
          slug: this.makeSlug(dto.name),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A subgenre with that slug already exists');
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateSubgenreDto) {
    const data: Prisma.SubgenreUpdateInput = { ...dto };
    if (dto.name !== undefined) {
      data.slug = this.makeSlug(dto.name);
    }

    try {
      return await this.prisma.subgenre.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`Subgenre ${id} not found`);
        }
        if (e.code === 'P2002') {
          throw new ConflictException(
            'A subgenre with that slug already exists',
          );
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.subgenre.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Subgenre ${id} not found`);
      }
      throw e;
    }
  }

  private makeSlug(name: string): string {
    return slugify(name, { lower: true, strict: true });
  }

  async findWithMovies(id: number) {
    const subgenre = await this.prisma.subgenre.findUnique({
      where: { id }, include: {
        movies: { select: { movie: true } },
      },
    });
    if (!subgenre) {
      throw new NotFoundException(`Subgenre ${id} not found`);
    }
    return subgenre;
  }
}
