import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ResultsModule } from './modules/results/results.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { PatientPortalModule } from './modules/patient-portal/patient-portal.module';
import { FavoritesModule } from './modules/favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PatientsModule,
    SessionsModule,
    ExercisesModule,
    ResultsModule,
    PatientPortalModule,
    FavoritesModule,
  ],
})
export class AppModule {}
