import { Injectable, BadRequestException } from '@nestjs/common';
import { ResearchService, ResearchCategory } from './research.service';
import { FacultyService } from './faculty.service';
import { DataProcessingEngine, RawExternalWork } from '@dsu/shared/processing-engine';

export interface StagedRow {
  rowNumber: number;
  rawRecord: Record<string, any>;
  parsedCategory: ResearchCategory;
  normalizedTitle: string;
  normalizedDoi?: string | null;
  detectedFacultyId?: string;
  facultyMatchConfidence?: number;
  facultyMatchReason?: string;
  isDuplicate: boolean;
  duplicateMatchedId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
  validationErrors: string[];
  status: 'READY' | 'HAS_ERRORS' | 'DUPLICATE_FLAGGED';
}

export interface IngestionBatchSummary {
  batchId: string;
  source: 'CSV_EXCEL' | 'ORCID_API' | 'SCOPUS_API';
  totalRows: number;
  readyCount: number;
  duplicateCount: number;
  errorCount: number;
  stagedRows: StagedRow[];
}

@Injectable()
export class IngestionService {
  private activeBatches: Map<string, IngestionBatchSummary> = new Map();

  constructor(
    private readonly researchService: ResearchService,
    private readonly facultyService: FacultyService,
  ) {}

  /**
   * Process and stage tabular CSV/Excel data
   */
  processCsvRows(rows: Record<string, any>[]): IngestionBatchSummary {
    const batchId = `batch-${Date.now()}`;
    const allFaculty = this.facultyService.getAllFaculty();
    const existingResearch = this.researchService.getResearchItems().map(r => ({
      id: r.id,
      doi: r.metadata?.doi,
      title: r.title,
      publicationYear: r.metadata?.publicationYear,
    }));

    const stagedRows: StagedRow[] = [];

    rows.forEach((row, idx) => {
      const rowNumber = idx + 1;
      const validationErrors: string[] = [];

      // 1. Mandatory Title Check
      const title = row['Title'] || row['title'] || row['Paper Title'] || row['Work Title'];
      if (!title || String(title).trim().length < 5) {
        validationErrors.push('Missing or invalid Title (minimum 5 characters)');
      }

      // 2. Identify Category
      const rawCat = (row['Category'] || row['category'] || row['Type'] || 'JOURNAL').toUpperCase();
      let parsedCategory: ResearchCategory = 'JOURNAL';
      if (rawCat.includes('CONF')) parsedCategory = 'CONFERENCE';
      else if (rawCat.includes('BOOK')) parsedCategory = 'BOOK';
      else if (rawCat.includes('PATENT')) parsedCategory = 'PATENT';
      else if (rawCat.includes('PROJECT') || rawCat.includes('GRANT')) parsedCategory = 'PROJECT';
      else if (rawCat.includes('CONSULT')) parsedCategory = 'CONSULTANCY';
      else if (rawCat.includes('FDP') || rawCat.includes('ACTIVITY')) parsedCategory = 'ACTIVITY';

      // 3. Normalization
      const normalizedDoi = DataProcessingEngine.normalizeDoi(row['DOI'] || row['doi']);
      const normalizedTitle = DataProcessingEngine.normalizeTitle(title || '');

      // 4. Author / Faculty Match
      const authorString = row['Authors'] || row['Author'] || row['Faculty'] || '';
      let detectedFacultyId: string | undefined;
      let facultyMatchConfidence = 0;
      let facultyMatchReason = 'NO_MATCH';

      for (const fac of allFaculty) {
        const matchRes = DataProcessingEngine.matchFacultyAuthor(
          fac.name,
          authorString,
          fac.orcidId,
          row['ORCID'] || row['orcid']
        );
        if (matchRes.matched && matchRes.confidence > facultyMatchConfidence) {
          facultyMatchConfidence = matchRes.confidence;
          facultyMatchReason = matchRes.matchMethod;
          detectedFacultyId = fac.id;
        }
      }

      // 5. Deduplication Check against Master DB
      const dupCheck = DataProcessingEngine.checkDuplicate(
        {
          doi: normalizedDoi || undefined,
          title: title || '',
          publicationYear: Number(row['Year'] || row['publicationYear']) || undefined,
          authors: [authorString],
          source: 'MANUAL_CSV',
        },
        existingResearch
      );

      // Determine Row Status
      let status: 'READY' | 'HAS_ERRORS' | 'DUPLICATE_FLAGGED' = 'READY';
      if (validationErrors.length > 0) {
        status = 'HAS_ERRORS';
      } else if (dupCheck.isDuplicate) {
        status = 'DUPLICATE_FLAGGED';
      }

      stagedRows.push({
        rowNumber,
        rawRecord: row,
        parsedCategory,
        normalizedTitle,
        normalizedDoi,
        detectedFacultyId,
        facultyMatchConfidence,
        facultyMatchReason,
        isDuplicate: dupCheck.isDuplicate,
        duplicateMatchedId: dupCheck.matchedId,
        duplicateConfidence: dupCheck.confidence,
        duplicateReason: dupCheck.matchReason,
        validationErrors,
        status,
      });
    });

    const summary: IngestionBatchSummary = {
      batchId,
      source: 'CSV_EXCEL',
      totalRows: stagedRows.length,
      readyCount: stagedRows.filter(r => r.status === 'READY').length,
      duplicateCount: stagedRows.filter(r => r.status === 'DUPLICATE_FLAGGED').length,
      errorCount: stagedRows.filter(r => r.status === 'HAS_ERRORS').length,
      stagedRows,
    };

    this.activeBatches.set(batchId, summary);
    return summary;
  }

  /**
   * Commit verified staged batch rows into Master Research DB
   */
  commitBatch(batchId: string, rowNumbersToCommit: number[]): { committedCount: number; committedItems: any[] } {
    const batch = this.activeBatches.get(batchId);
    if (!batch) throw new BadRequestException(`Batch '${batchId}' not found or already processed`);

    const committedItems: any[] = [];

    batch.stagedRows.forEach(row => {
      if (rowNumbersToCommit.includes(row.rowNumber) && row.status !== 'HAS_ERRORS') {
        const created = this.researchService.createResearchItem({
          category: row.parsedCategory,
          title: row.rawRecord['Title'] || row.rawRecord['title'],
          facultyId: row.detectedFacultyId || 'fac-1',
          academicYear: row.rawRecord['AcademicYear'] || '2024-25',
          metadata: {
            ...row.rawRecord,
            doi: row.normalizedDoi,
            ingestionBatchId: batchId,
          },
        });
        if (created.item) {
          committedItems.push(created.item);
        }
      }
    });

    return {
      committedCount: committedItems.length,
      committedItems,
    };
  }
}
