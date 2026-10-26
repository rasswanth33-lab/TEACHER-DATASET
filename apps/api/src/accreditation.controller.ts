import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { UserRole, FrameworkType, AccreditationFrameworkConfig } from '@dsu/shared';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('api/accreditation')
export class AccreditationController {
  // Versioned Framework Registry (Requirements can evolve without altering Master Research Database)
  private frameworks: AccreditationFrameworkConfig[] = [
    {
      id: 'fw-naac-2024',
      framework: FrameworkType.NAAC,
      version: 'NAAC University Manual 2024 (Binary Ready)',
      description: 'Standard NAAC Assessment Criteria for Autonomous Universities (Criterion 3)',
      scope: 'INSTITUTION',
      assessmentWindowYears: 5,
      criteria: [
        {
          code: '3.4.3',
          title: 'Research papers per teacher in journals notified on UGC CARE / Scopus',
          description: 'Calculates the ratio of peer-reviewed/indexed articles per full-time faculty across the 5-year assessment window.',
          scoreTarget: 15,
          formula: 'SUM(verified_scopus_papers_5yrs) / AVG(full_time_faculty_5yrs)',
          requiredFields: ['title', 'journalName', 'issn', 'publicationYear', 'doi', 'isScopusIndexed'],
          evidenceChecklist: ['First page reprint PDF with DSU institutional affiliation', 'DOI link', 'Scopus listing proof'],
          outputFormat: 'EXCEL_TEMPLATE',
        },
        {
          code: '3.4.5',
          title: 'Bibliometrics of publications based on average Citation Index in Scopus/WoS',
          description: 'Calculates citations per paper indexed in international indexing databases.',
          scoreTarget: 10,
          formula: 'SUM(total_citations_5yrs) / SUM(indexed_papers_5yrs)',
          requiredFields: ['scopusAuthorId', 'citationsCount', 'doi', 'publicationYear'],
          evidenceChecklist: ['Scopus citation report export', 'Author profile URL'],
          outputFormat: 'EXCEL_TEMPLATE',
        },
        {
          code: '3.1.2',
          title: 'Percentage of departments having sponsored research projects',
          description: 'Evaluates research grants received from Government and Non-Government agencies.',
          scoreTarget: 10,
          formula: '(departments_with_grants / total_departments) * 100',
          requiredFields: ['fundingAgency', 'grantAmountSanctioned', 'departmentCode'],
          evidenceChecklist: ['Sanction letters', 'Audited utilization certificates'],
          outputFormat: 'EXCEL_TEMPLATE',
        },
        {
          code: '3.4.2',
          title: 'Patents published and granted in the last 5 years',
          description: 'Intellectual Property Rights filing and grant achievements.',
          scoreTarget: 5,
          formula: 'COUNT(granted_patents_5yrs) + 0.5 * COUNT(published_patents_5yrs)',
          requiredFields: ['patentNumber', 'applicationNumber', 'status', 'filingDate'],
          evidenceChecklist: ['Patent Office Gazette notification', 'Grant certificate'],
          outputFormat: 'EXCEL_TEMPLATE',
        },
      ],
    },
    {
      id: 'fw-nba-tier1-2023',
      framework: FrameworkType.NBA,
      version: 'NBA Tier-I UG Engineering Manual 2023',
      description: 'Departmental Self Assessment Report (SAR) Criterion 5: Faculty Information & Contributions',
      scope: 'PROGRAM_DEPARTMENT',
      assessmentWindowYears: 3,
      criteria: [
        {
          code: 'Criterion 5.1',
          title: 'Faculty Cadre Proportion & Student-Faculty Ratio (SFR)',
          description: 'Target SFR <= 15:1 and Cadre ratio 1:2:6 (Prof : Assoc : Asst).',
          scoreTarget: 25,
          formula: 'SFR = Total_Students / Total_Regular_Faculty; Cadre Proportion marks based on AICTE norms',
          requiredFields: ['departmentCode', 'designation', 'studentIntakeCount'],
          evidenceChecklist: ['Faculty appointment orders', 'AICTE approval letter', 'Joining reports'],
          outputFormat: 'SAR_TABLE_PDF',
        },
        {
          code: 'Criterion 5.3.1',
          title: 'Academic Research: Faculty Publications in Indexed Venues',
          description: 'Faculty publication assessment over CAY, CAYm1, and CAYm2.',
          scoreTarget: 15,
          formula: 'FP = 2 * (Indexed_Papers_CAY + CAYm1 + CAYm2) / Assessment_Faculty_Count',
          requiredFields: ['departmentCode', 'academicYear', 'isScopusIndexed', 'quartile'],
          evidenceChecklist: ['Paper reprints', 'Scopus / SCI indexing confirmation'],
          outputFormat: 'SAR_TABLE_PDF',
        },
        {
          code: 'Criterion 5.3.2',
          title: 'Sponsored Research Grants (Amount Sanctioned in Lakhs)',
          description: 'Funding received for ongoing or completed research projects.',
          scoreTarget: 10,
          formula: 'Marks scaled by cumulative funding (>= 20 Lakhs yields 5 marks per sub-tier)',
          requiredFields: ['departmentCode', 'grantAmountSanctioned', 'principalInvestigator'],
          evidenceChecklist: ['Sanction orders', 'Bank credit proofs'],
          outputFormat: 'SAR_TABLE_PDF',
        },
        {
          code: 'Criterion 5.3.3',
          title: 'Development Activities, Consultancy & IPR / Patents',
          description: 'Industrial consultancy revenue and patent grant deliverables.',
          scoreTarget: 5,
          formula: 'Consultancy revenue (>= 5 Lakhs) + Granted patents count',
          requiredFields: ['departmentCode', 'consultancyAmount', 'patentsGranted'],
          evidenceChecklist: ['Client MoUs', 'Consultancy completion certificates', 'Patent grant letters'],
          outputFormat: 'SAR_TABLE_PDF',
        },
      ],
    },
  ];

  @Get('frameworks')
  getFrameworks() {
    return {
      success: true,
      count: this.frameworks.length,
      data: this.frameworks,
    };
  }

  @Get('summary')
  getAccreditationSummary(@Query('framework') framework: string = 'NAAC', @Query('dept') dept?: string) {
    const isNba = framework.toUpperCase() === 'NBA';
    const targetFw = this.frameworks.find(f => f.framework === (isNba ? FrameworkType.NBA : FrameworkType.NAAC));

    if (isNba) {
      return {
        success: true,
        framework: targetFw?.version || 'NBA (Tier-I UG Engineering)',
        versionId: targetFw?.id,
        assessmentWindow: '3-Year Rolling (CAY: 2025-26, CAYm1: 2024-25, CAYm2: 2023-24)',
        department: dept || 'Computer Science & Engineering',
        criteria: [
          {
            code: 'Criterion 5.1',
            title: 'Faculty Cadre Proportion & Student-Faculty Ratio',
            scoreTarget: 25,
            projectedScore: 23.5,
            status: 'COMPLIANT',
            metrics: { sfr: '1:14.2', profCount: 8, assocCount: 14, asstCount: 22 },
            evidenceStatus: 'VERIFIED (100% Appointment Orders on file)',
          },
          {
            code: 'Criterion 5.3.1',
            title: 'Academic Research (Faculty Publications in Scopus/SCI)',
            scoreTarget: 15,
            projectedScore: 14.2,
            status: 'DATA_COMPLETE',
            metrics: {
              scopusIndexedCount: 43,
              cayCount: 18,
              cayM1Count: 15,
              cayM2Count: 10,
              evidenceCoverage: '98%',
            },
            evidenceStatus: 'VERIFIED (Reprints & DOIs linked)',
          },
          {
            code: 'Criterion 5.3.2',
            title: 'Sponsored Research (Grants Sanctioned)',
            scoreTarget: 10,
            projectedScore: 9.0,
            status: 'DATA_COMPLETE',
            metrics: {
              sanctionedValueLakhs: 84.5,
              activeProjectsCount: 5,
            },
            evidenceStatus: 'VERIFIED (Sanction letters archived)',
          },
          {
            code: 'Criterion 5.3.3',
            title: 'Development Activities, Consultancy & Patents',
            scoreTarget: 5,
            projectedScore: 4.8,
            status: 'DATA_COMPLETE',
            metrics: {
              patentsGranted: 6,
              consultancyRevenueLakhs: 18.2,
            },
            evidenceStatus: 'VERIFIED (Patent Gazette copies attached)',
          },
        ],
      };
    }

    // NAAC Institutional Summary
    return {
      success: true,
      framework: targetFw?.version || 'NAAC University Manual 2024',
      versionId: targetFw?.id,
      assessmentWindow: '5-Year Rolling (2021-22 through 2025-26)',
      scope: 'Institution-Wide (All Schools & Departments)',
      criteria: [
        {
          code: '3.4.3',
          title: 'Number of research papers per teacher in journals notified on UGC CARE / Scopus',
          scoreTarget: 15,
          academicYear: '5-Year Cumulative',
          verifiedCount: 148,
          fullTimeFacultyAvg: 142,
          ratioPerTeacher: 1.04,
          dataCompleteness: '98%',
          missingEvidenceCount: 3,
        },
        {
          code: '3.4.5',
          title: 'Bibliometrics of publications based on average Citation Index in Scopus/WoS',
          scoreTarget: 10,
          academicYear: '5-Year Cumulative',
          verifiedCount: 112,
          totalCitations: 1450,
          averageCitationsPerPaper: 12.95,
          dataCompleteness: '95%',
          missingEvidenceCount: 4,
        },
        {
          code: '3.1.2',
          title: 'Percentage of departments having research projects sponsored by govt and non-govt agencies',
          scoreTarget: 10,
          academicYear: '5-Year Cumulative',
          verifiedCount: 12,
          totalDepartments: 14,
          departmentPercentage: 85.7,
          dataCompleteness: '100%',
          missingEvidenceCount: 0,
        },
        {
          code: '3.4.2',
          title: 'Patents published and granted in the last 5 years',
          scoreTarget: 5,
          academicYear: '5-Year Cumulative',
          verifiedCount: 38,
          patentsGranted: 14,
          patentsPublished: 24,
          dataCompleteness: '100%',
          missingEvidenceCount: 0,
        },
      ],
    };
  }

  // Protected: Only Super Admin and Research Admin (Dean/IQAC) can generate statutory NAAC Excel / PDF reports
  @Get('export/naac-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN)
  exportNaacReport(@Query('format') format: string = 'excel') {
    return {
      success: true,
      reportType: `NAAC_STATUTORY_DATA_TEMPLATE_${format.toUpperCase()}`,
      frameworkVersion: 'NAAC University Manual 2024 (Binary Ready)',
      timestamp: new Date().toISOString(),
      watermark: 'OFFICIAL_DSU_IQAC_SEALED',
      downloadUrl: `/reports/NAAC_Cycle1_Criterion3_2026.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
      verifiedMasterRecordsCount: 148,
      includedEvidenceHyperlinks: 145,
    };
  }

  // Protected: Super Admin, Research Admin, or Department Admin (HOD) can generate NBA Program SAR Section 5
  @Get('export/nba-sar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN, UserRole.DEPT_ADMIN)
  exportNbaSar(@Query('dept') dept: string = 'CSE') {
    return {
      success: true,
      reportType: 'NBA_TIER1_UG_SAR_CRITERION5_DOCUMENT',
      program: `B.Tech in ${dept}`,
      frameworkVersion: 'NBA UG Manual 2023',
      timestamp: new Date().toISOString(),
      watermark: 'OFFICIAL_NBA_SAR_SUBMISSION',
      downloadUrl: `/reports/NBA_SAR_Criterion5_${dept}_2026.pdf`,
      cadreRatioStatus: 'COMPLIANT (Prof 8 : Assoc 14 : Asst 22)',
      sfrValue: '14.2:1',
      totalPublicationsEvaluated: 43,
    };
  }
}

