import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActorsModule } from './actors/actors.module';
import { AuthModule } from './auth/auth.module';
import { DirectorsModule } from './directors/directors.module';
import { MoviesModule } from './movies/movies.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductionCompaniesModule } from './production-companies/production-companies.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubgenresModule } from './subgenres/subgenres.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    SubgenresModule,
    DirectorsModule,
    ActorsModule,
    ProductionCompaniesModule,
    PlansModule,
    ProfilesModule,
    ReviewsModule,
    MoviesModule,
    UsersModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
