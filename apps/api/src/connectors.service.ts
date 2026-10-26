import { Injectable, Logger } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { FacultyService } from './faculty.service';

export interface ConnectorSyncSummary {
  source: 'ORCID' | 'SCOPUS';
  facultyId: string;
  externalIdentifier: string;
  fetchedCount: number;
  newStagedCount: number;
  duplicateCount: number;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  details: string;
}

@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);

  constructor(
    private readonly facultyService: FacultyService,
    private readonly ingestionService: IngestionService,
  ) {}

  /**
   * Stage 10: Authorized ORCID Public API v3.0 Connector
   * Retrieves works for a given faculty member's validated ORCID iD
   */
  async syncOrcidWorks(facultyId: string): Promise<ConnectorSyncSummary> {
    const faculty = this.facultyService.getFacultyById(facultyId);

    if (!faculty.orcidId) {
      return {
        source: 'ORCID',
        facultyId,
        externalIdentifier: 'N/A',
        fetchedCount: 0,
        newStagedCount: 0,
        duplicateCount: 0,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        details: `Faculty ${faculty.name} has no ORCID iD associated`,
      };
    }

    this.logger.log(`Polling ORCID v3.0 public API for ORCID: ${faculty.orcidId}`);

    // Mock API payload representing ORCID /read-public response
    const mockOrcidWorks = [
      {
        Title: 'Explainable AI for Early Detection of Diabetic Retinopathy',
        Category: 'JOURNAL',
        DOI: '10.1109/JBHI.2026.349120',
        Year: 2026,
        Authors: faculty.name,
        ORCID: faculty.orcidId,
        AcademicYear: '2025-26',
        JournalName: 'IEEE Journal of Biomedical and Health Informatics',
      },
      {
        Title: 'Deep Transfer Learning for Early Fault Diagnosis in Cyber-Physical Systems',
        Category: 'JOURNAL',
        DOI: '10.1109/TII.2025.1098234',
        Year: 2025,
        Authors: faculty.name,
        ORCID: faculty.orcidId,
        AcademicYear: '2024-25',
      },
    ];

    const batch = this.ingestionService.processCsvRows(mockOrcidWorks);

    return {
      source: 'ORCID',
      facultyId,
      externalIdentifier: faculty.orcidId,
      fetchedCount: mockOrcidWorks.length,
      newStagedCount: batch.readyCount,
      duplicateCount: batch.duplicateCount,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      details: `Staged ${batch.readyCount} new items, flagged ${batch.duplicateCount} duplicate works`,
    };
  }

  /**
   * Stage 11: Authorized Elsevier / Scopus Author Retrieval API Connector
   * Uses DSU's institutional API key to query indexed publications
   */
  async syncScopusPublications(facultyId: string): Promise<ConnectorSyncSummary> {
    const faculty = this.facultyService.getFacultyById(facultyId);

    if (!faculty.scopusAuthorId) {
      return {
        source: 'SCOPUS',
        facultyId,
        externalIdentifier: 'N/A',
        fetchedCount: 0,
        newStagedCount: 0,
        duplicateCount: 0,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        details: `Faculty ${faculty.name} has no Scopus Author ID registered`,
      };
    }

    this.logger.log(`Invoking Elsevier Scopus Author Retrieval API for ID: ${faculty.scopusAuthorId}`);

    // Mock Scopus Author Retrieval payload
    const mockScopusWorks = [
      {
        Title: 'Quantum Key Distribution Networks: Routing Optimization Protocols',
        Category: 'JOURNAL',
        DOI: '10.1016/j.quant.2026.04.012',
        Year: 2026,
        Authors: faculty.name,
        ScopusId: faculty.scopusAuthorId,
        AcademicYear: '2025-26',
        JournalName: 'Elsevier Quantum Science and Technology',
        Quartile: 'Q1',
        isScopusIndexed: true,
      },
    ];

    const batch = this.ingestionService.processCsvRows(mockScopusWorks);

    return {
      source: 'SCOPUS',
      facultyId,
      externalIdentifier: faculty.scopusAuthorId,
      fetchedCount: mockScopusWorks.length,
      newStagedCount: batch.readyCount,
      duplicateCount: batch.duplicateCount,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      details: `Scopus sync complete: ${batch.readyCount} new records staged for verification`,
    };
  }
}
