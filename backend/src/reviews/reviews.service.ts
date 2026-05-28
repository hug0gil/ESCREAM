import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    perPage = 10,
    userId?: number,
    movieId?: number,
  ) {
    const where: Prisma.ReviewWhereInput = {
      ...(userId !== undefined && { userId }),
      ...(movieId !== undefined && { movieId }),
    };
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          movie: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
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
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        movie: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }

  async create(dto: CreateReviewDto) {
    try {
      return await this.prisma.review.create({ data: { ...dto } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          `User ${dto.userId} or movie ${dto.movieId} does not exist`,
        );
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateReviewDto) {
    try {
      return await this.prisma.review.update({
        where: { id },
        data: { ...dto },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`Review ${id} not found`);
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(`User or movie does not exist`);
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.review.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Review ${id} not found`);
      }
      throw e;
    }
  }
}
