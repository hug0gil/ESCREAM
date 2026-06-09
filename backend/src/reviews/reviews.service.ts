import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    perPage = 10,
    profileId?: number,
    movieId?: number,
  ) {
    const where: Prisma.ReviewWhereInput = {
      ...(profileId !== undefined && { profileId }),
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
          profile: { select: { id: true, profileName: true } },
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
        profile: { select: { id: true, profileName: true } },
        movie: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }
º
  async create(dto: CreateReviewDto) {
    try {
      const review = await this.prisma.review.create({ data: { ...dto } });
      this.logger.log({
        msg: 'Review created',
        reviewId: review.id,
        profileId: review.profileId,
        movieId: review.movieId,
      });
      return review;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          `Profile ${dto.profileId} or movie ${dto.movieId} does not exist`,
        );
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateReviewDto) {
    try {
      const review = await this.prisma.review.update({
        where: { id },
        data: { ...dto },
      });
      this.logger.log({
        msg: 'Review updated',
        reviewId: review.id,
        fields: Object.keys(dto),
      });
      return review;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`Review ${id} not found`);
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(`Profile or movie does not exist`);
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.review.delete({ where: { id } });
      this.logger.log({ msg: 'Review deleted', reviewId: id });
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
