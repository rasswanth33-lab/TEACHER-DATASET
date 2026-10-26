import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

export interface Department {
  id: string;
  code: string;
  name: string;
  school: string;
  isActive: boolean;
}

export interface FacultyProfile {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  departmentCode: string;
  highestQualification: string;
  dateOfJoining: string;
  orcidId?: string;
  scopusAuthorId?: string;
  researcherIdWos?: string;
  googleScholarId?: string;
  isActive: boolean;
  profileCompleteness: number; // percentage 0-100
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class FacultyService {
  private departments: Department[] = [
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', school: 'School of Engineering', isActive: true },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering', school: 'School of Engineering', isActive: true },
    { id: 'dept-aiml', code: 'AIML', name: 'Artificial Intelligence & Machine Learning', school: 'School of Engineering', isActive: true },
    { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering', school: 'School of Engineering', isActive: true },
    { id: 'dept-mgmt', code: 'DOMS', name: 'Department of Management Studies', school: 'School of Commerce & Management', isActive: true },
  ];

  private facultyList: FacultyProfile[] = [
    {
      id: 'fac-1',
      employeeId: 'DSU-CSE-101',
      name: 'Dr. Ramesh Sharma',
      email: 'ramesh.sharma@dsu.edu.in',
      designation: 'PROFESSOR',
      departmentCode: 'CSE',
      highestQualification: 'Ph.D.',
      dateOfJoining: '2018-07-15',
      orcidId: '0000-0002-1825-0097',
      scopusAuthorId: '57194512300',
      researcherIdWos: 'A-4920-2019',
      isActive: true,
      profileCompleteness: 95,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    },
    {
      id: 'fac-2',
      employeeId: 'DSU-ECE-204',
      name: 'Dr. Ananya Iyer',
      email: 'ananya.iyer@dsu.edu.in',
      designation: 'ASSOCIATE_PROFESSOR',
      departmentCode: 'ECE',
      highestQualification: 'Ph.D.',
      dateOfJoining: '2020-01-20',
      orcidId: '0000-0001-9876-5432',
      scopusAuthorId: '57211244500',
      isActive: true,
      profileCompleteness: 90,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2026-02-15T00:00:00Z',
    },
    {
      id: 'fac-3',
      employeeId: 'DSU-AIML-305',
      name: 'Dr. Vikram Malhotra',
      email: 'vikram.m@dsu.edu.in',
      designation: 'ASSISTANT_PROFESSOR',
      departmentCode: 'AIML',
      highestQualification: 'Ph.D.',
      dateOfJoining: '2022-08-01',
      orcidId: '0000-0003-4567-8901',
      scopusAuthorId: '57234567890',
      isActive: true,
      profileCompleteness: 85,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    },
  ];

  // --- Department Methods ---
  getAllDepartments(): Department[] {
    return this.departments.filter(d => d.isActive);
  }

  getDepartmentByCode(code: string): Department {
    const dept = this.departments.find(d => d.code.toUpperCase() === code.toUpperCase());
    if (!dept) throw new NotFoundException(`Department '${code}' not found`);
    return dept;
  }

  // --- Faculty Methods ---
  getAllFaculty(filters?: { departmentCode?: string; designation?: string; search?: string }): FacultyProfile[] {
    let list = this.facultyList.filter(f => f.isActive);

    if (filters?.departmentCode) {
      list = list.filter(f => f.departmentCode.toUpperCase() === filters.departmentCode.toUpperCase());
    }
    if (filters?.designation) {
      list = list.filter(f => f.designation.toUpperCase() === filters.designation.toUpperCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.employeeId.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.orcidId && f.orcidId.includes(q))
      );
    }
    return list;
  }

  getFacultyById(id: string): FacultyProfile {
    const fac = this.facultyList.find(f => f.id === id || f.employeeId === id);
    if (!fac) throw new NotFoundException(`Faculty record with id/employeeId '${id}' not found`);
    return fac;
  }

  createFaculty(dto: Partial<FacultyProfile>): FacultyProfile {
    // Unique employee ID & email check
    if (this.facultyList.some(f => f.employeeId === dto.employeeId)) {
      throw new ConflictException(`Employee ID '${dto.employeeId}' already exists`);
    }
    if (this.facultyList.some(f => f.email.toLowerCase() === dto.email?.toLowerCase())) {
      throw new ConflictException(`Email '${dto.email}' already registered`);
    }

    const completeness = this.calculateCompleteness(dto);
    const newFaculty: FacultyProfile = {
      id: `fac-${Date.now()}`,
      employeeId: dto.employeeId || `DSU-GEN-${Math.floor(Math.random() * 900 + 100)}`,
      name: dto.name || '',
      email: dto.email || '',
      designation: dto.designation || 'ASSISTANT_PROFESSOR',
      departmentCode: dto.departmentCode || 'CSE',
      highestQualification: dto.highestQualification || 'M.Tech',
      dateOfJoining: dto.dateOfJoining || new Date().toISOString().split('T')[0],
      orcidId: dto.orcidId || undefined,
      scopusAuthorId: dto.scopusAuthorId || undefined,
      researcherIdWos: dto.researcherIdWos || undefined,
      googleScholarId: dto.googleScholarId || undefined,
      isActive: true,
      profileCompleteness: completeness,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.facultyList.push(newFaculty);
    return newFaculty;
  }

  updateIdentifiers(facultyId: string, identifiers: { orcidId?: string; scopusAuthorId?: string; researcherIdWos?: string; googleScholarId?: string }) {
    const fac = this.getFacultyById(facultyId);
    if (identifiers.orcidId !== undefined) fac.orcidId = identifiers.orcidId;
    if (identifiers.scopusAuthorId !== undefined) fac.scopusAuthorId = identifiers.scopusAuthorId;
    if (identifiers.researcherIdWos !== undefined) fac.researcherIdWos = identifiers.researcherIdWos;
    if (identifiers.googleScholarId !== undefined) fac.googleScholarId = identifiers.googleScholarId;
    fac.profileCompleteness = this.calculateCompleteness(fac);
    fac.updatedAt = new Date().toISOString();
    return fac;
  }

  updateFaculty(facultyId: string, updates: Partial<FacultyProfile>): FacultyProfile {
    const fac = this.getFacultyById(facultyId);
    if (updates.name !== undefined) fac.name = updates.name;
    if (updates.designation !== undefined) fac.designation = updates.designation;
    if (updates.departmentCode !== undefined) fac.departmentCode = updates.departmentCode;
    if (updates.highestQualification !== undefined) fac.highestQualification = updates.highestQualification;
    if (updates.dateOfJoining !== undefined) fac.dateOfJoining = updates.dateOfJoining;
    if (updates.orcidId !== undefined) fac.orcidId = updates.orcidId;
    if (updates.scopusAuthorId !== undefined) fac.scopusAuthorId = updates.scopusAuthorId;
    if (updates.researcherIdWos !== undefined) fac.researcherIdWos = updates.researcherIdWos;
    if (updates.googleScholarId !== undefined) fac.googleScholarId = updates.googleScholarId;
    if (updates.isActive !== undefined) fac.isActive = updates.isActive;

    fac.profileCompleteness = this.calculateCompleteness(fac);
    fac.updatedAt = new Date().toISOString();
    return fac;
  }

  toggleStatus(facultyId: string): FacultyProfile {
    const fac = this.getFacultyById(facultyId);
    fac.isActive = !fac.isActive;
    fac.updatedAt = new Date().toISOString();
    return fac;
  }

  private calculateCompleteness(f: Partial<FacultyProfile>): number {
    let score = 40; // Base required info (name, email, empId, dept, designation)
    if (f.highestQualification) score += 15;
    if (f.dateOfJoining) score += 15;
    if (f.orcidId) score += 15;
    if (f.scopusAuthorId) score += 15;
    return Math.min(score, 100);
  }
}
