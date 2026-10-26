import { Controller, Post, Body, Param, UseGuards, Get, Query } from '@nestjs/common';
import { UserRole } from '@dsu/shared';
import { IngestionService } from './ingestion.service';
import { ConnectorsService } from './connectors.service';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('api/ingestion')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly connectorsService: ConnectorsService,
  ) {}

  // Bulk CSV / Excel Parser and Staging Trigger (Restricted to Admins & Coordinators)
  @Post('csv-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  uploadCsv(@Body() body: { rows: Record<string, any>[] }) {
    const batchSummary = this.ingestionService.processCsvRows(body.rows || []);
    return {
      success: true,
      message: `Parsed ${batchSummary.totalRows} rows: ${batchSummary.readyCount} ready, ${batchSummary.duplicateCount} duplicate warnings, ${batchSummary.errorCount} errors`,
      data: batchSummary,
    };
  }

  // Commit Staged Rows into Master DB
  @Post('commit-batch/:batchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  commitBatch(
    @Param('batchId') batchId: string,
    @Body() body: { rowNumbers: number[] },
  ) {
    const result = this.ingestionService.commitBatch(batchId, body.rowNumbers || []);
    return {
      success: true,
      message: `Successfully verified and committed ${result.committedCount} records to Master Database`,
      data: result,
    };
  }

  // Stage 10: Trigger ORCID Sync
  @Post('sync/orcid/:facultyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN, UserRole.FACULTY)
  syncOrcid(@Param('facultyId') facultyId: string) {
    return this.connectorsService.syncOrcidWorks(facultyId);
  }

  // Stage 11: Trigger Scopus Sync
  @Post('sync/scopus/:facultyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  syncScopus(@Param('facultyId') facultyId: string) {
    return this.connectorsService.syncScopusPublications(facultyId);
  }
}
