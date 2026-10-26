import { Injectable, NotFoundException } from '@nestjs/common';
import { DataProcessingEngine, RawExternalWork } from '@dsu/shared/processing-engine';

export type ResearchCategory =
  | 'JOURNAL'
  | 'CONFERENCE'
  | 'BOOK'
  | 'PATENT'
  | 'PROJECT'
  | 'CONSULTANCY'
  | 'ACTIVITY';

export interface ResearchItem {
  id: string;
  category: ResearchCategory;
  title: string;
  facultyId: string;
  academicYear: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'CORRECTED';
  metadata: Record<string, any>;
  hasEvidence: boolean;
  evidenceFilePath?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ResearchService {
  private researchItems: ResearchItem[] = [
    // 1. Journal
    {
      id: 'res-101',
      category: 'JOURNAL',
      title: 'Deep Transfer Learning for Early Fault Diagnosis in Cyber-Physical Systems',
      facultyId: 'fac-1',
      academicYear: '2024-25',
      status: 'VERIFIED',
      metadata: {
        journalName: 'IEEE Transactions on Industrial Informatics',
        doi: '10.1109/tii.2025.1098234',
        issn: '1551-3203',
        volume: '21',
        issue: '4',
        pages: '3104-3115',
        publicationYear: 2025,
        quartile: 'Q1',
        isScopusIndexed: true,
        isWosIndexed: true,
        isUgcCareListed: true,
        citationsCount: 14,
        authors: ['Dr. Ramesh Sharma', 'K. V. Subbarao'],
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/pub-101-ieee-first-page.pdf',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
    // 2. Conference
    {
      id: 'res-102',
      category: 'CONFERENCE',
      title: 'Energy Efficient Resource Allocation in 6G Heterogeneous Cloud-RAN',
      facultyId: 'fac-2',
      academicYear: '2024-25',
      status: 'VERIFIED',
      metadata: {
        conferenceName: 'IEEE International Conference on Communications (ICC 2025)',
        organizer: 'IEEE Communications Society',
        venue: 'Montreal, Canada',
        proceedingsDoi: '10.1109/icc.2025.203948',
        isScopusIndexed: true,
        publicationYear: 2025,
        authors: ['Dr. Ananya Iyer', 'M. S. Roy'],
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/conf-102-icc-cert.pdf',
      createdAt: '2025-03-10T00:00:00Z',
      updatedAt: '2025-03-25T00:00:00Z',
    },
    // 3. Book Chapter
    {
      id: 'res-103',
      category: 'BOOK',
      title: 'Edge Intelligence Architectures for Autonomous Electric Vehicles',
      facultyId: 'fac-1',
      academicYear: '2023-24',
      status: 'VERIFIED',
      metadata: {
        bookTitle: 'Next-Generation Mobility and Smart Grid Networks',
        publisher: 'Springer Nature',
        isbn: '978-3-030-99881-2',
        chapterTitle: 'Edge Intelligence Architectures for Autonomous Electric Vehicles',
        publicationYear: 2024,
        scope: 'INTERNATIONAL',
        authors: ['Dr. Ramesh Sharma'],
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/book-103-springer.pdf',
      createdAt: '2024-06-12T00:00:00Z',
      updatedAt: '2024-07-01T00:00:00Z',
    },
    // 4. Patent
    {
      id: 'res-104',
      category: 'PATENT',
      title: 'An Adaptive Load Balancer System for Multi-Tenant Edge Clouds',
      facultyId: 'fac-1',
      academicYear: '2024-25',
      status: 'VERIFIED',
      metadata: {
        applicationNumber: '202441098234 A',
        patentNumber: 'IN-504921',
        jurisdiction: 'India',
        filingDate: '2023-11-10',
        publicationDate: '2024-05-15',
        grantDate: '2025-01-18',
        patentStatus: 'GRANTED',
        inventors: ['Dr. Ramesh Sharma', 'Dr. Vikram Malhotra'],
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/patent-104-grant-cert.pdf',
      createdAt: '2024-11-15T00:00:00Z',
      updatedAt: '2025-01-20T00:00:00Z',
    },
    // 5. Sponsored Project
    {
      id: 'res-105',
      category: 'PROJECT',
      title: 'Design and Development of AI-Driven Threat Mitigation in Critical Cyber Infrastructures',
      facultyId: 'fac-1',
      academicYear: '2023-24',
      status: 'VERIFIED',
      metadata: {
        fundingAgency: 'SERB - Science and Engineering Research Board',
        agencyType: 'GOVERNMENT',
        sanctionOrderNo: 'CRG/2023/004912',
        sanctionedAmount: 4850000.00, // INR 48.5 Lakhs
        startDate: '2023-09-01',
        endDate: '2026-08-31',
        projectStatus: 'ONGOING',
        piName: 'Dr. Ramesh Sharma',
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/project-105-serb-sanction.pdf',
      createdAt: '2023-09-10T00:00:00Z',
      updatedAt: '2023-09-10T00:00:00Z',
    },
    // 6. Consultancy
    {
      id: 'res-106',
      category: 'CONSULTANCY',
      title: 'Industrial Automated Vision System for Semiconductor Quality Assurance',
      facultyId: 'fac-2',
      academicYear: '2024-25',
      status: 'VERIFIED',
      metadata: {
        clientOrganization: 'Bosch Global Software Technologies Pvt Ltd',
        financialYear: '2024-25',
        revenueGenerated: 1250000.00, // INR 12.5 Lakhs
        leadFaculty: 'Dr. Ananya Iyer',
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/consultancy-106-bosch.pdf',
      createdAt: '2024-08-01T00:00:00Z',
      updatedAt: '2024-08-15T00:00:00Z',
    },
    // 7. Academic Activity / FDP
    {
      id: 'res-107',
      category: 'ACTIVITY',
      title: 'ATAL AICTE FDP on Quantum Cryptography and Communications',
      facultyId: 'fac-3',
      academicYear: '2024-25',
      status: 'VERIFIED',
      metadata: {
        activityType: 'FDP',
        durationDays: 5,
        organizingBody: 'AICTE Training and Learning (ATAL) Academy',
        startDate: '2024-11-18',
        endDate: '2024-11-22',
      },
      hasEvidence: true,
      evidenceFilePath: '/evidence/activity-107-atal.pdf',
      createdAt: '2024-11-25T00:00:00Z',
      updatedAt: '2024-11-25T00:00:00Z',
    },
    // Ingested / Staged Item pending approval
    {
      id: 'res-108',
      category: 'JOURNAL',
      title: 'Quantum Key Distribution Networks: Routing Optimization Protocols',
      facultyId: 'fac-3',
      academicYear: '2025-26',
      status: 'PENDING',
      metadata: {
        journalName: 'Elsevier Quantum Science and Technology',
        doi: '10.1016/j.quant.2026.04.012',
        publicationYear: 2026,
        quartile: 'Q1',
        isScopusIndexed: true,
        citationsCount: 1,
        authors: ['Dr. Vikram Malhotra', 'P. Sen'],
      },
      hasEvidence: false,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    },
  ];

  // Query Research Items with Filters
  getResearchItems(filters?: {
    category?: ResearchCategory;
    facultyId?: string;
    academicYear?: string;
    status?: string;
  }): ResearchItem[] {
    let list = this.researchItems;

    if (filters?.category) {
      list = list.filter(r => r.category === filters.category);
    }
    if (filters?.facultyId) {
      list = list.filter(r => r.facultyId === filters.facultyId);
    }
    if (filters?.academicYear) {
      list = list.filter(r => r.academicYear === filters.academicYear);
    }
    if (filters?.status) {
      list = list.filter(r => r.status.toUpperCase() === filters.status?.toUpperCase());
    }

    return list;
  }

  getResearchById(id: string): ResearchItem {
    const item = this.researchItems.find(r => r.id === id);
    if (!item) throw new NotFoundException(`Research item '${id}' not found`);
    return item;
  }

  // Create/Ingest with Deduplication Check
  createResearchItem(dto: {
    category: ResearchCategory;
    title: string;
    facultyId: string;
    academicYear: string;
    metadata: Record<string, any>;
  }): { item: ResearchItem; duplicateWarning?: any } {
    // Check duplicates if DOI is present in journals/conferences
    if (dto.metadata?.doi) {
      const existingCandidateList = this.researchItems
        .filter(r => r.metadata?.doi || r.title)
        .map(r => ({
          id: r.id,
          doi: r.metadata?.doi,
          title: r.title,
          publicationYear: r.metadata?.publicationYear,
        }));

      const dupCheck = DataProcessingEngine.checkDuplicate(
        {
          doi: dto.metadata.doi,
          title: dto.title,
          publicationYear: dto.metadata?.publicationYear,
          authors: dto.metadata?.authors || [],
          source: 'MANUAL_CSV',
        },
        existingCandidateList
      );

      if (dupCheck.isDuplicate) {
        return {
          item: null as any,
          duplicateWarning: {
            isDuplicate: true,
            matchedRecordId: dupCheck.matchedId,
            reason: dupCheck.matchReason,
            confidence: dupCheck.confidence,
          },
        };
      }
    }

    const newItem: ResearchItem = {
      id: `res-${Date.now()}`,
      category: dto.category,
      title: dto.title,
      facultyId: dto.facultyId,
      academicYear: dto.academicYear || '2024-25',
      status: 'PENDING',
      metadata: dto.metadata || {},
      hasEvidence: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.researchItems.push(newItem);
    return { item: newItem };
  }

  // Verify and Approve into Master DB
  verifyResearchItem(id: string, verifierUserId: string, remarks?: string): ResearchItem {
    const item = this.getResearchById(id);
    item.status = 'VERIFIED';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  // Attach Verified Evidence Document
  attachEvidence(id: string, filePath: string): ResearchItem {
    const item = this.getResearchById(id);
    item.hasEvidence = true;
    item.evidenceFilePath = filePath;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  // Consolidated Faculty Research Profile (Summary stats & category-wise grouping)
  getFacultyResearchProfile(facultyId: string) {
    const items = this.researchItems.filter(r => r.facultyId === facultyId && r.status === 'VERIFIED');

    const journalCount = items.filter(r => r.category === 'JOURNAL').length;
    const conferenceCount = items.filter(r => r.category === 'CONFERENCE').length;
    const bookCount = items.filter(r => r.category === 'BOOK').length;
    const patentCount = items.filter(r => r.category === 'PATENT').length;
    const projectCount = items.filter(r => r.category === 'PROJECT').length;
    const consultancyCount = items.filter(r => r.category === 'CONSULTANCY').length;
    const activityCount = items.filter(r => r.category === 'ACTIVITY').length;

    const totalFundingInr = items
      .filter(r => r.category === 'PROJECT')
      .reduce((acc, curr) => acc + (curr.metadata?.sanctionedAmount || 0), 0);

    const totalConsultancyInr = items
      .filter(r => r.category === 'CONSULTANCY')
      .reduce((acc, curr) => acc + (curr.metadata?.revenueGenerated || 0), 0);

    const totalCitations = items
      .filter(r => r.category === 'JOURNAL')
      .reduce((acc, curr) => acc + (curr.metadata?.citationsCount || 0), 0);

    return {
      facultyId,
      summary: {
        totalVerifiedPublications: journalCount + conferenceCount + bookCount,
        journals: journalCount,
        conferences: conferenceCount,
        books: bookCount,
        patents: patentCount,
        sponsoredProjects: projectCount,
        consultancyProjects: consultancyCount,
        academicActivities: activityCount,
        totalFundingInr,
        totalConsultancyInr,
        totalCitations,
      },
      items,
    };
  }
}
