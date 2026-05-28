import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marca los roles permitidos en un endpoint. Úsalo junto a JwtUserAuthGuard
 * y RolesGuard: @UseGuards(JwtUserAuthGuard, RolesGuard) + @Roles(Role.ADMIN).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
