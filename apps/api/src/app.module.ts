import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { FacultyController } from './faculty.controller';
import { FacultyService } from './faculty.service';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { AccreditationController } from './accreditation.controller';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ConnectorsService } from './connectors.service';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    FacultyController,
    ResearchController,
    AccreditationController,
    IngestionController,
  ],
  providers: [
    AppService,
    FacultyService,
    ResearchService,
    IngestionService,
    ConnectorsService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
