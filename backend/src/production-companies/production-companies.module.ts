import { Module } from '@nestjs/common';
import { ProductionCompaniesController } from './production-companies.controller';
import { ProductionCompaniesService } from './production-companies.service';

@Module({
  controllers: [ProductionCompaniesController],
  providers: [ProductionCompaniesService],
})
export class ProductionCompaniesModule {}
