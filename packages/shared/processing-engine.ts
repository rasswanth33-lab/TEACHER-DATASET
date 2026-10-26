/**
 * DSU Faculty Research Intelligence System - Data Processing Engine
 * Handles Normalization, Author Matching, and Duplicate Detection
 */

export interface RawExternalWork {
  doi?: string;
  title: string;
  publicationYear?: number;
  authors: string[];
  source: 'ORCID' | 'SCOPUS' | 'MANUAL_CSV';
  externalId?: string;
  journalOrBook?: string;
}

export class DataProcessingEngine {
  /**
   * Normalizes DOIs (cleans prefixes, strips URL formats, lowercases)
   */
  static normalizeDoi(rawDoi?: string): string | null {
    if (!rawDoi) return null;
    let clean = rawDoi.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\/doi\.org\//, '');
    clean = clean.replace(/^doi:\s*/, '');
    return clean || null;
  }

  /**
   * Normalizes title strings for fuzzy matching
   */
  static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Checks for duplicates against existing master records
   */
  static checkDuplicate(
    candidate: RawExternalWork,
    existingList: Array<{ id: string; doi?: string | null; title: string; publicationYear?: number }>
  ): { isDuplicate: boolean; confidence: number; matchReason: string; matchedId?: string } {
    const candidateDoi = this.normalizeDoi(candidate.doi);
    const candidateNormTitle = this.normalizeTitle(candidate.title);

    for (const item of existingList) {
      // 1. Exact DOI match -> 100% confidence duplicate
      if (candidateDoi && item.doi && this.normalizeDoi(item.doi) === candidateDoi) {
        return {
          isDuplicate: true,
          confidence: 1.0,
          matchReason: 'EXACT_DOI_MATCH',
          matchedId: item.id,
        };
      }

      // 2. Normalized Title + Year check
      const itemNormTitle = this.normalizeTitle(item.title);
      if (candidateNormTitle === itemNormTitle) {
        const yearMatches = candidate.publicationYear && item.publicationYear
          ? Math.abs(candidate.publicationYear - item.publicationYear) <= 1
          : true;

        if (yearMatches) {
          return {
            isDuplicate: true,
            confidence: 0.95,
            matchReason: 'NORMALIZED_TITLE_AND_YEAR_MATCH',
            matchedId: item.id,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      matchReason: 'NO_DUPLICATE_FOUND',
    };
  }

  /**
   * Evaluates match confidence between an external author name and a faculty profile
   */
  static matchFacultyAuthor(
    facultyName: string,
    authorNameInPaper: string,
    facultyOrcid?: string,
    paperOrcid?: string
  ): { matched: boolean; confidence: number; matchMethod: string } {
    // 1. Direct ORCID equality
    if (facultyOrcid && paperOrcid && facultyOrcid.trim() === paperOrcid.trim()) {
      return { matched: true, confidence: 1.0, matchMethod: 'ORCID_IDENTIFIER' };
    }

    // 2. Name normalization and parts check
    const normFac = this.normalizeTitle(facultyName);
    const normAuthor = this.normalizeTitle(authorNameInPaper);

    if (normFac === normAuthor) {
      return { matched: true, confidence: 0.9, matchMethod: 'EXACT_NORMALIZED_NAME' };
    }

    // Last name / initials heuristic
    const facParts = normFac.split(' ');
    const authorParts = normAuthor.split(' ');
    const facLastName = facParts[facParts.length - 1];
    const authorLastName = authorParts[authorParts.length - 1];

    if (facLastName.length > 2 && facLastName === authorLastName) {
      return { matched: true, confidence: 0.75, matchMethod: 'LAST_NAME_MATCH_REVIEW_RECOMMENDED' };
    }

    return { matched: false, confidence: 0.0, matchMethod: 'NONE' };
  }
}
