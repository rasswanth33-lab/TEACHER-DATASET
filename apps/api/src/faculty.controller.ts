import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@dsu/shared';
import { FacultyService } from './faculty.service';
import { ResearchService } from './research.service';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('api/faculty')
export class FacultyController {
  constructor(
    private readonly facultyService: FacultyService,
    private readonly researchService: ResearchService,
  ) {}

  @Get('departments')
  getDepartments() {
    return { success: true, data: this.facultyService.getAllDepartments() };
  }

  @Get()
  getAllFaculty(
    @Query('dept') dept?: string,
    @Query('designation') designation?: string,
    @Query('search') search?: string,
  ) {
    const list = this.facultyService.getAllFaculty({ departmentCode: dept, designation, search });
    return { success: true, count: list.length, data: list };
  }

  @Get(':id')
  getFacultyById(@Param('id') id: string) {
    const fac = this.facultyService.getFacultyById(id);
    return { success: true, data: fac };
  }

  // Consolidated Faculty Research Profile (Stage 8)
  @Get(':id/research-profile')
  getFacultyResearchProfile(@Param('id') id: string) {
    const faculty = this.facultyService.getFacultyById(id);
    const research = this.researchService.getFacultyResearchProfile(faculty.id);
    return {
      success: true,
      faculty,
      researchProfile: research,
    };
  }

  // Create Faculty Profile (Restricted to Admins)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  createFaculty(@Body() createDto: any) {
    const created = this.facultyService.createFaculty(createDto);
    return { success: true, message: 'Faculty created successfully', data: created };
  }

  // Update Faculty Details (Restricted to Admins)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  updateFaculty(@Param('id') id: string, @Body() body: any) {
    const updated = this.facultyService.updateFaculty(id, body);
    return { success: true, message: 'Faculty profile updated successfully', data: updated };
  }

  // Toggle Active / Inactive Status (Admins only)
  @Post(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  toggleFacultyStatus(@Param('id') id: string) {
    const updated = this.facultyService.toggleStatus(id);
    return { success: true, message: `Faculty status updated to ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`, data: updated };
  }

  // Update External Identifiers (ORCID / Scopus / WoS)
  @Put(':id/identifiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN, UserRole.FACULTY)
  updateIdentifiers(@Param('id') id: string, @Body() body: any) {
    const updated = this.facultyService.updateIdentifiers(id, body);
    return { success: true, message: 'Identifiers updated successfully', data: updated };
  }
}
