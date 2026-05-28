import { Module } from '@nestjs/common';
import { SubgenresController } from './subgenres.controller';
import { SubgenresService } from './subgenres.service';

@Module({
  controllers: [SubgenresController],
  providers: [SubgenresService],
})
export class SubgenresModule {}
