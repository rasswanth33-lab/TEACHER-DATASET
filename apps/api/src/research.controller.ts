import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@dsu/shared';
import { ResearchService, ResearchCategory } from './research.service';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('api/research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('items')
  getResearchItems(
    @Query('category') category?: ResearchCategory,
    @Query('facultyId') facultyId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('status') status?: string,
  ) {
    const data = this.researchService.getResearchItems({ category, facultyId, academicYear, status });
    return { success: true, count: data.length, data };
  }

  @Get('items/:id')
  getResearchById(@Param('id') id: string) {
    const item = this.researchService.getResearchById(id);
    return { success: true, data: item };
  }

  // Create/Ingest Research Item across any category with deduplication
  @Post('items/ingest')
  ingestResearchItem(@Body() body: any) {
    const result = this.researchService.createResearchItem(body);
    if (result.duplicateWarning) {
      return {
        success: false,
        flag: 'DUPLICATE_DETECTED',
        warning: result.duplicateWarning,
      };
    }
    return {
      success: true,
      message: 'Research item ingested into staging queue',
      data: result.item,
    };
  }

  // Verification Gate Approval (Restricted to Coordinators & Admins)
  @Post('items/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  verifyItem(@Param('id') id: string, @Body() body: { verifierUserId?: string; remarks?: string }) {
    const verified = this.researchService.verifyResearchItem(id, body?.verifierUserId || 'usr-admin', body?.remarks);
    return {
      success: true,
      message: 'Item verified and committed to official Master Research DB',
      data: verified,
    };
  }

  // Evidence Attachment Route
  @Post('items/:id/evidence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN, UserRole.FACULTY)
  attachEvidence(@Param('id') id: string, @Body() body: { filePath: string }) {
    const updated = this.researchService.attachEvidence(id, body.filePath);
    return {
      success: true,
      message: 'Evidence document linked to research record',
      data: updated,
    };
  }
}
