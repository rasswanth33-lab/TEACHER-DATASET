/**
 * DSU Faculty Research Intelligence System - Core Domain Models & Contracts
 * Fully aligned with Section 4: Database Design specifications
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESEARCH_ADMIN = 'RESEARCH_ADMIN',
  DEPT_ADMIN = 'DEPT_ADMIN',
  FACULTY = 'FACULTY',
  VIEWER = 'VIEWER',
}

export enum RecordStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  CORRECTED = 'CORRECTED',
  MERGED = 'MERGED',
}

export enum PublicationType {
  JOURNAL = 'JOURNAL',
  CONFERENCE = 'CONFERENCE',
  BOOK = 'BOOK',
  BOOK_CHAPTER = 'BOOK_CHAPTER',
}

export enum FrameworkType {
  NAAC = 'NAAC',
  NBA = 'NBA',
  NIRF = 'NIRF',
}

// -------------------------------------------------------------
// 1. Faculty and Organization Domain DTOs
// -------------------------------------------------------------
export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  school: string;
  isActive: boolean;
}

export interface FacultyDto {
  facultyId: string;
  employeeId: string;
  name: string;
  email: string;
  departmentId: string;
  designation: string;
  orcid?: string;
  scopusAuthorId?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RETIRED' | 'RELIEVED';
  createdAt: string;
  updatedAt: string;
}

export interface ResearchIdentifierDto {
  id: string;
  facultyId: string;
  systemName: 'ORCID' | 'SCOPUS' | 'WEB_OF_SCIENCE' | 'GOOGLE_SCHOLAR' | 'VIDWAN';
  identifier: string;
  profileUrl?: string;
  isVerified: boolean;
  lastSyncedAt?: string;
}

// -------------------------------------------------------------
// 2. Research Domain DTOs
// -------------------------------------------------------------
export interface PublicationDto {
  publicationId: string;
  title: string;
  doi?: string;
  publicationType: PublicationType;
  journal?: string;
  publisher?: string;
  issnOrEissn?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  date?: string;
  publicationYear: number;
  source?: string;
  externalId?: string;
  verificationStatus: RecordStatus;
  citationsCount?: number;
}

export interface PublicationAuthorDto {
  id: string;
  publicationId: string;
  facultyOrExternalAuthorId?: string;
  authorName: string;
  authorOrder: number;
  affiliation?: string;
  matchingConfidence?: number; // 0.00 to 1.00
  isCorresponding: boolean;
}

export interface JournalDto {
  id: string;
  title: string;
  publisher?: string;
  issnPrint?: string;
  issnOnline?: string;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  isScopusIndexed: boolean;
  isWosIndexed: boolean;
  isUgcCareListed: boolean;
}

export interface PatentDto {
  id: string;
  title: string;
  applicationNumber: string;
  patentNumber?: string;
  jurisdiction: string;
  filingDate: string;
  publicationDate?: string;
  grantDate?: string;
  patentStatus: 'FILED' | 'PUBLISHED' | 'GRANTED';
  facultyId: string;
  status: RecordStatus;
}

export interface ResearchProjectDto {
  id: string;
  title: string;
  fundingAgency: string;
  agencyType: 'GOVERNMENT' | 'NON_GOVERNMENT' | 'INDUSTRY';
  sanctionOrderNo?: string;
  sanctionedAmount: number;
  startDate: string;
  endDate?: string;
  projectStatus: 'ONGOING' | 'COMPLETED';
  principalInvestigatorId: string;
  status: RecordStatus;
}

export interface FundingRecordDto {
  id: string;
  projectId: string;
  financialYear: string;
  installmentNo: number;
  amountReleased: number;
  releasedDate: string;
  utilizationCertNo?: string;
}

export interface ResearchActivityDto {
  id: string;
  title: string;
  activityType: 'CONSULTANCY' | 'FDP' | 'WORKSHOP' | 'CONFERENCE_CHAIR';
  financialYear: string;
  revenueAmount?: number;
  clientOrOrganizer?: string;
  startDate: string;
  endDate?: string;
  facultyId: string;
  status: RecordStatus;
}

// -------------------------------------------------------------
// 3. Operations Domain DTOs
// -------------------------------------------------------------
export interface SyncJobDto {
  id: string;
  source: 'ORCID' | 'SCOPUS' | 'EXCEL_BULK';
  facultyId?: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  recordsFound: number;
  newRecords: number;
  updatedRecords: number;
  duplicatesSkipped: number;
  startedAt: string;
  completedAt?: string;
}

export interface SyncRecordDto {
  id: string;
  syncJobId?: string;
  source: 'ORCID' | 'SCOPUS' | 'EXCEL_CSV';
  rawPayload: any;
  normalizedDoi?: string;
  normalizedTitle: string;
  publicationYear?: number;
  detectedFacultyId?: string;
  matchConfidence?: number;
  duplicateOfId?: string;
  processingStatus: 'STAGED' | 'PROMOTED' | 'DISMISSED';
}

export interface VerificationRecordDto {
  id: string;
  recordType: 'PUBLICATION' | 'PATENT' | 'PROJECT' | 'ACTIVITY';
  status: RecordStatus;
  remarks?: string;
  verifiedByUserId: string;
  recordId: string;
  createdAt: string;
}

export interface EvidenceDocumentDto {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedByFacultyId?: string;
  publicationId?: string;
  patentId?: string;
  projectId?: string;
  activityId?: string;
}

export interface AuditLogDto {
  id: string;
  userId?: string;
  action: 'LOGIN' | 'CREATE' | 'VERIFY' | 'REJECT' | 'EXPORT';
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// 4. Accreditation Domain DTOs
// -------------------------------------------------------------
export interface FrameworkDto {
  id: string;
  type: FrameworkType;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface FrameworkVersionDto {
  id: string;
  frameworkId: string;
  versionCode: string;
  title: string;
  applicableFrom: string;
  isCurrent: boolean;
}

export interface CriterionDto {
  id: string;
  frameworkVersionId: string;
  code: string;
  title: string;
  weightageMarks: number;
}

export interface SubcriterionMetricDto {
  id: string;
  criterionId: string;
  metricCode: string;
  title: string;
  metricType: 'QUANTITATIVE' | 'QUALITATIVE';
  targetScore?: number;
  assessmentYearsCount: number;
}

export interface CriteriaMappingDto {
  id: string;
  metricId: string;
  sourceEntity: string;
  sourceField: string;
  targetTemplateColumn: string;
  isRequired: boolean;
  transformationRule?: string;
}

export interface AccreditationFrameworkConfig {
  id: string;
  framework: FrameworkType;
  version: string;
  description: string;
  scope: 'INSTITUTION' | 'PROGRAM_DEPARTMENT';
  assessmentWindowYears: number;
  criteria: any[];
}

export interface GeneratedReportDto {
  id: string;
  frameworkVersionId: string;
  scopeType: 'INSTITUTION' | 'DEPARTMENT' | 'PROGRAM';
  scopeId?: string;
  academicYear: string;
  generatedBy: string;
  integrityHash?: string;
  createdAt: string;
}

