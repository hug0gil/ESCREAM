import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 10, userId?: number) {
    const where: Prisma.ProfileWhereInput = userId ? { userId } : {};
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.profile.count({ where }),
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
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
    return profile;
  }

  async create(dto: CreateProfileDto) {
    try {
      const profile = await this.prisma.profile.create({ data: { ...dto } });
      this.logger.log({
        msg: 'Profile created',
        profileId: profile.id,
        userId: profile.userId,
      });
      return profile;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(`User ${dto.userId} does not exist`);
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateProfileDto) {
    try {
      const profile = await this.prisma.profile.update({
        where: { id },
        data: { ...dto },
      });
      this.logger.log({
        msg: 'Profile updated',
        profileId: profile.id,
        userId: profile.userId,
        fields: Object.keys(dto),
      });
      return profile;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException(`Profile ${id} not found`);
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(`User does not exist`);
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.profile.delete({ where: { id } });
      this.logger.log({ msg: 'Profile deleted', profileId: id });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(`Profile ${id} not found`);
      }
      throw e;
    }
  }
}
