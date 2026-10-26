'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  FileSpreadsheet, 
  Sparkles,
  ExternalLink,
  Layers,
  ShieldCheck,
  UserCheck,
  Lock,
  Database,
  ArrowRight,
  Filter,
  Check,
  X,
  FileCheck,
  Download,
  BookOpen,
  Plus,
  UploadCloud,
  FileCode,
  Eye,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type UserRole = 'SUPER_ADMIN' | 'RESEARCH_ADMIN' | 'DEPT_ADMIN' | 'FACULTY';
export type ResearchCategory = 'JOURNAL' | 'CONFERENCE' | 'BOOK' | 'PATENT' | 'PROJECT' | 'CONSULTANCY' | 'ACTIVITY';

interface StagingItem {
  id: string;
  source: 'ORCID' | 'SCOPUS' | 'EXCEL_CSV';
  rawTitle: string;
  rawDoi: string;
  normalizedDoi: string;
  year: number;
  authors: string[];
  matchedFaculty: string;
  matchConfidence: number;
  matchMethod: string;
  isDuplicate: boolean;
  duplicateConfidence: number;
  duplicateReason?: string;
  evidenceUrl: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
}

interface MasterResearchRecord {
  id: string;
  category: ResearchCategory;
  title: string;
  venueOrPublisher: string;
  academicYear: string;
  year: number;
  doiOrIdentifier: string;
  facultyName: string;
  department: string;
  quartileOrIndexing: string;
  citations: number;
  fundingAmount?: string;
  evidenceUrl: string;
  status: 'VERIFIED';
}

interface FacultyProfile {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  orcidId: string;
  scopusAuthorId: string;
  profileCompleteness: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RELIEVED';
  journalCount: number;
  conferenceCount: number;
  patentCount: number;
  grantsAmount: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'staging' | 'master_db' | 'accreditation' | 'faculty' | 'import_center'>('overview');
  const [accreditationType, setAccreditationType] = useState<'NAAC' | 'NBA'>('NAAC');
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Faculty for slide-out profile drawer
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyProfile | null>(null);

  // New Research Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ResearchCategory>('JOURNAL');
  const [newFaculty, setNewFaculty] = useState('Dr. Ramesh Sharma');
  const [newDoi, setNewDoi] = useState('');
  const [newYear, setNewYear] = useState('2025-26');
  const [newVenue, setNewVenue] = useState('');

  // Staging Pipeline records (Section 3 Architecture)
  const [stagingList, setStagingList] = useState<StagingItem[]>([
    {
      id: 'stg-201',
      source: 'SCOPUS',
      rawTitle: 'Quantum Key Distribution Networks: Routing Optimization Protocols',
      rawDoi: 'https://doi.org/10.1016/j.quant.2026.04.012',
      normalizedDoi: '10.1016/j.quant.2026.04.012',
      year: 2026,
      authors: ['Dr. Vikram Malhotra', 'P. Sen'],
      matchedFaculty: 'Dr. Vikram Malhotra (AI & ML)',
      matchConfidence: 0.95,
      matchMethod: 'SCOPUS_AUTHOR_ID_EXACT',
      isDuplicate: false,
      duplicateConfidence: 0,
      evidenceUrl: 'https://dsu.edu.in/vault/staging/stg-201-elsevier-reprint.pdf',
      status: 'PENDING_REVIEW',
    },
    {
      id: 'stg-202',
      source: 'ORCID',
      rawTitle: 'Explainable AI for Early Detection of Diabetic Retinopathy in Telemedicine',
      rawDoi: 'doi: 10.1109/JBHI.2026.349120',
      normalizedDoi: '10.1109/jbhi.2026.349120',
      year: 2026,
      authors: ['Dr. Ramesh Sharma', 'S. Gupta'],
      matchedFaculty: 'Dr. Ramesh Sharma (CSE)',
      matchConfidence: 1.0,
      matchMethod: 'ORCID_IDENTIFIER_EXACT',
      isDuplicate: false,
      duplicateConfidence: 0,
      evidenceUrl: 'https://dsu.edu.in/vault/staging/stg-202-ieee-reprint.pdf',
      status: 'PENDING_REVIEW',
    },
    {
      id: 'stg-203',
      source: 'EXCEL_CSV',
      rawTitle: 'Deep Transfer Learning for Early Fault Diagnosis in Cyber-Physical Systems',
      rawDoi: '10.1109/TII.2025.1098234',
      normalizedDoi: '10.1109/tii.2025.1098234',
      year: 2025,
      authors: ['Dr. Ramesh Sharma'],
      matchedFaculty: 'Dr. Ramesh Sharma (CSE)',
      matchConfidence: 0.90,
      matchMethod: 'NAME_AFFILIATION_MATCH',
      isDuplicate: true,
      duplicateConfidence: 1.0,
      duplicateReason: 'Exact DOI collision with Master Record #pub-101',
      evidenceUrl: 'https://dsu.edu.in/vault/staging/stg-203-dup.pdf',
      status: 'REJECTED',
    },
  ]);

  // Master Research Database (Single Source of Truth - All 7 Categories)
  const [masterList, setMasterList] = useState<MasterResearchRecord[]>([
    {
      id: 'pub-101',
      category: 'JOURNAL',
      title: 'Deep Transfer Learning for Early Fault Diagnosis in Cyber-Physical Systems',
      venueOrPublisher: 'IEEE Transactions on Industrial Informatics',
      academicYear: '2024-25',
      year: 2025,
      doiOrIdentifier: '10.1109/TII.2025.1098234',
      facultyName: 'Dr. Ramesh Sharma',
      department: 'CSE',
      quartileOrIndexing: 'Q1 / Scopus & WoS',
      citations: 14,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/pub-101-ieee.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-102',
      category: 'CONFERENCE',
      title: 'Energy Efficient Resource Allocation in 6G Heterogeneous Cloud-RAN',
      venueOrPublisher: 'IEEE International Conference on Communications (ICC 2025)',
      academicYear: '2024-25',
      year: 2025,
      doiOrIdentifier: '10.1109/ICC.2025.203948',
      facultyName: 'Dr. Ananya Iyer',
      department: 'ECE',
      quartileOrIndexing: 'Scopus Indexed Proceedings',
      citations: 5,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/pub-102-icc.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-103',
      category: 'BOOK',
      title: 'Edge Intelligence Architectures for Autonomous Electric Vehicles',
      venueOrPublisher: 'Springer Nature (ISBN: 978-3-030-99881-2)',
      academicYear: '2023-24',
      year: 2024,
      doiOrIdentifier: 'ISBN: 978-3-030-99881-2',
      facultyName: 'Dr. Ramesh Sharma',
      department: 'CSE',
      quartileOrIndexing: 'Peer-Reviewed Monograph',
      citations: 8,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/pub-103-springer.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-104',
      category: 'PATENT',
      title: 'An Adaptive Load Balancer System for Multi-Tenant Edge Clouds',
      venueOrPublisher: 'Indian Patent Office Gazette (Govt. of India)',
      academicYear: '2024-25',
      year: 2024,
      doiOrIdentifier: 'IN-Patent No. 504921',
      facultyName: 'Dr. Ramesh Sharma',
      department: 'CSE',
      quartileOrIndexing: 'GRANTED (IPR India)',
      citations: 0,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/patent-504921-grant.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-105',
      category: 'PROJECT',
      title: 'AI-Driven Zero-Trust Threat Mitigation in Critical Smart Grid Infrastructures',
      venueOrPublisher: 'Science and Engineering Research Board (SERB - CRG)',
      academicYear: '2023-24',
      year: 2023,
      doiOrIdentifier: 'SERB/CRG/2023/004812',
      facultyName: 'Dr. Ramesh Sharma',
      department: 'CSE',
      quartileOrIndexing: 'Government Sponsored Project',
      citations: 0,
      fundingAmount: '₹48,50,000',
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/serb-sanction-letter.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-106',
      category: 'CONSULTANCY',
      title: 'Deep Vision Edge Pipeline for Automated Semiconductor Wafer Defect QA',
      venueOrPublisher: 'Bosch Global Software Technologies Pvt Ltd',
      academicYear: '2024-25',
      year: 2024,
      doiOrIdentifier: 'BGSW-R&D-2024-88',
      facultyName: 'Dr. Ananya Iyer',
      department: 'ECE',
      quartileOrIndexing: 'Industry Sponsored Consultancy',
      citations: 0,
      fundingAmount: '₹12,50,000',
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/bosch-po-approval.pdf',
      status: 'VERIFIED',
    },
    {
      id: 'pub-107',
      category: 'ACTIVITY',
      title: 'Advanced AICTE ATAL Faculty Development Programme on 6G and Quantum Computing',
      venueOrPublisher: 'AICTE Training and Learning Academy',
      academicYear: '2024-25',
      year: 2025,
      doiOrIdentifier: 'ATAL-FDP-2025-091',
      facultyName: 'Dr. Vikram Malhotra',
      department: 'AI & ML',
      quartileOrIndexing: 'National Level FDP Co-ordinator',
      citations: 0,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/atal-completion-cert.pdf',
      status: 'VERIFIED',
    },
  ]);

  // Faculty Directory (Section 6)
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([
    {
      id: 'fac-1',
      employeeId: 'DSU-CSE-101',
      name: 'Dr. Ramesh Sharma',
      designation: 'Professor & Dean R&D',
      department: 'Computer Science & Engineering',
      orcidId: '0000-0002-1825-0097',
      scopusAuthorId: '57194512300',
      profileCompleteness: 95,
      status: 'ACTIVE',
      journalCount: 28,
      conferenceCount: 19,
      patentCount: 3,
      grantsAmount: '₹48.50 Lakhs',
    },
    {
      id: 'fac-2',
      employeeId: 'DSU-ECE-204',
      name: 'Dr. Ananya Iyer',
      designation: 'Associate Professor',
      department: 'Electronics & Communication',
      orcidId: '0000-0001-9876-5432',
      scopusAuthorId: '57211244500',
      profileCompleteness: 90,
      status: 'ACTIVE',
      journalCount: 15,
      conferenceCount: 12,
      patentCount: 2,
      grantsAmount: '₹12.50 Lakhs',
    },
    {
      id: 'fac-3',
      employeeId: 'DSU-AIML-305',
      name: 'Dr. Vikram Malhotra',
      designation: 'Assistant Professor',
      department: 'Artificial Intelligence & Machine Learning',
      orcidId: '0000-0003-4567-8901',
      scopusAuthorId: '57234567890',
      profileCompleteness: 88,
      status: 'ACTIVE',
      journalCount: 11,
      conferenceCount: 8,
      patentCount: 1,
      grantsAmount: '₹5.00 Lakhs',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Pipeline Action: Promote from Staging to Master Database
  const handleVerifyAndCommit = (item: StagingItem) => {
    if (item.isDuplicate) {
      showToast('❌ Blocked: Duplicate records cannot be promoted into Master Research Database.');
      return;
    }

    setStagingList(prev => prev.map(s => s.id === item.id ? { ...s, status: 'VERIFIED' } : s));

    const newMasterRecord: MasterResearchRecord = {
      id: `pub-${Date.now().toString().slice(-4)}`,
      category: 'JOURNAL',
      title: item.rawTitle,
      venueOrPublisher: 'Elsevier / IEEE Scopus Indexed Journal',
      academicYear: '2025-26',
      year: item.year,
      doiOrIdentifier: item.normalizedDoi,
      facultyName: item.matchedFaculty.split(' (')[0],
      department: item.matchedFaculty.includes('CSE') ? 'CSE' : item.matchedFaculty.includes('ECE') ? 'ECE' : 'AI & ML',
      quartileOrIndexing: 'Q1 / Scopus Indexed',
      citations: 1,
      evidenceUrl: item.evidenceUrl,
      status: 'VERIFIED',
    };

    setMasterList(prev => [newMasterRecord, ...prev]);
    showToast(`✅ Approved & Promoted "${item.rawTitle.slice(0, 32)}..." into Master Database`);
  };

  const handleDismissRecord = (id: string) => {
    setStagingList(prev => prev.map(s => s.id === id ? { ...s, status: 'REJECTED' } : s));
    showToast('⚠️ Record dismissed and preserved in Staging Audit log');
  };

  // Add Manual Record
  const handleAddManualRecord = () => {
    if (!newTitle.trim()) {
      showToast('⚠️ Please enter a valid work title');
      return;
    }

    // Duplicate check on DOI
    if (newDoi.trim()) {
      const exists = masterList.some(m => m.doiOrIdentifier.toLowerCase() === newDoi.trim().toLowerCase());
      if (exists) {
        showToast('❌ Duplicate Warning: A master record with this DOI/identifier already exists!');
        return;
      }
    }

    const newRec: MasterResearchRecord = {
      id: `pub-${Date.now().toString().slice(-4)}`,
      category: newCategory,
      title: newTitle.trim(),
      venueOrPublisher: newVenue.trim() || 'DSU Academic Press',
      academicYear: newYear,
      year: parseInt(newYear.split('-')[0]) || 2025,
      doiOrIdentifier: newDoi.trim() || `GEN-${Date.now().toString().slice(-6)}`,
      facultyName: newFaculty,
      department: newFaculty.includes('Ramesh') ? 'CSE' : newFaculty.includes('Ananya') ? 'ECE' : 'AI & ML',
      quartileOrIndexing: newCategory === 'PATENT' ? 'Published' : 'Peer-Reviewed',
      citations: 0,
      evidenceUrl: 'https://dsu.edu.in/vault/evidence/uploaded-proof.pdf',
      status: 'VERIFIED',
    };

    setMasterList(prev => [newRec, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDoi('');
    setNewVenue('');
    showToast(`✅ Successfully registered new ${newCategory} record in Master DB`);
  };

  // Filtered master records
  const filteredMaster = masterList.filter(item => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.venueOrPublisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doiOrIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Statutory Export Handler (Excel / XLSX)
  const handleExportAccreditationExcel = (type: 'NAAC' | 'NBA' | 'Master_Research') => {
    try {
      const dataToExport = masterList.map(item => ({
        'Record ID': item.id,
        'Category': item.category,
        'Title of Research Paper / Work': item.title,
        'Lead Faculty': item.facultyName,
        'Department': item.department,
        'Journal / Publisher / Venue': item.venueOrPublisher,
        'Academic Year': item.academicYear,
        'DOI / Patent / Grant No.': item.doiOrIdentifier,
        'Indexing & Quartile': item.quartileOrIndexing,
        'Citations': item.citations,
        'Funding Sanctioned (INR)': item.fundingAmount || 'N/A',
        'Verification Status': item.status,
        'Evidence Hyperlink': item.evidenceUrl
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${type}_Verified_Data`);

      const filename = `DSU_${type}_Official_Statutory_Data_${new Date().getFullYear()}.xlsx`;
      XLSX.writeFile(workbook, filename);
      showToast(`📊 Downloaded official ${filename} sealed with DSU Master DB metadata`);
    } catch (err) {
      showToast('❌ Error generating spreadsheet file');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090d16', color: '#f3f4f6' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#1e293b',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '1px solid #3b82f6',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside style={{
        width: '280px',
        borderRight: '1px solid #1f293d',
        backgroundColor: '#0c111d',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>DSU Research</h2>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Intelligence & Accreditation</span>
          </div>
        </div>

        {/* Role Switcher Widget */}
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid #1f293d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ShieldCheck size={14} color="#60a5fa" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd' }}>Active System Role (RBAC)</span>
          </div>
          <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <option value="SUPER_ADMIN">Super Administrator</option>
            <option value="RESEARCH_ADMIN">Research Admin (Dean / IQAC)</option>
            <option value="DEPT_ADMIN">Dept Admin (HOD - CSE)</option>
            <option value="FACULTY">Faculty Member</option>
          </select>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: Layers },
            { 
              id: 'staging', 
              label: 'Verification Queue', 
              icon: RefreshCw, 
              badge: `${stagingList.filter(s => s.status === 'PENDING_REVIEW').length} Pending` 
            },
            { id: 'master_db', label: 'Master Research DB (7 Cats)', icon: Database, badge: `${masterList.length} Verified` },
            { id: 'import_center', label: 'Ingestion & Connectors', icon: UploadCloud },
            { id: 'accreditation', label: 'NAAC & NBA Engines', icon: Award },
            { id: 'faculty', label: 'Faculty Directory', icon: GraduationCap },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: item.id === 'staging' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: item.id === 'staging' ? '#fbbf24' : '#34d399',
                    fontWeight: '700'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Architecture Pipeline Summary Widget */}
        <div style={{
          marginTop: 'auto',
          padding: '14px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid #1f293d',
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#60a5fa', fontWeight: '700' }}>
            <Sparkles size={14} />
            <span>Architecture Guarantee</span>
          </div>
          <p style={{ color: '#9ca3af' }}>
            External data enters <strong style={{ color: '#fbbf24' }}>Staging</strong> first. Only verified records with verified evidence become official DSU Master data.
          </p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
              Dayananda Sagar University
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              Master Faculty Research Intelligence System (Enter Once → Verify Once → Reuse Everywhere)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              color: '#34d399',
              fontWeight: '700'
            }}>
              <UserCheck size={14} />
              <span>Role: {currentRole}</span>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Log Research Output</span>
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'Active Faculty Members', value: `${facultyList.length}`, sub: '100% ORCID & Scopus Linked', color: '#3b82f6' },
                { label: 'Verified Master Records', value: `${masterList.length}`, sub: 'Across 7 Research Categories', color: '#10b981' },
                { label: 'Pending Verification Queue', value: `${stagingList.filter(s => s.status === 'PENDING_REVIEW').length}`, sub: 'Awaiting Coordinator Sign-off', color: '#f59e0b' },
                { label: 'Sponsored Grants Value', value: '₹61.00 Lakhs', sub: 'SERB & Industry Consultancy', color: '#8b5cf6' },
              ].map((card, i) => (
                <div key={i} className="glass-panel" style={{ padding: '20px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{card.label}</span>
                  <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '8px 0 4px 0' }}>{card.value}</h3>
                  <span style={{ fontSize: '11px', color: card.color, fontWeight: '600' }}>{card.sub}</span>
                </div>
              ))}
            </div>

            {/* Architecture Ingestion Visualizer Banner */}
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#93c5fd', marginBottom: '8px' }}>
                End-to-End Architectural Flow Active in System
              </h4>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.6' }}>
                <strong>Sources</strong> (ORCID v3.0 / Scopus Author API / CSV Migration) &rarr; <span style={{ color: '#fbbf24' }}>Staging Isolation Layer</span> &rarr; Normalize &rarr; Multi-Tier Author Match &rarr; Duplicate Detection &rarr; Evidence Verification &rarr; <span style={{ color: '#34d399' }}>Master Research Database</span> &rarr; <span style={{ color: '#60a5fa' }}>Decoupled NAAC (5-Yr) & NBA (3-Yr SAR) Engines</span>.
              </p>
            </div>

            {/* Overview Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Verification Queue (Pending Review)</h3>
                  <button 
                    onClick={() => setActiveTab('staging')} 
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Open Full Queue <ArrowRight size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stagingList.map(item => (
                    <div key={item.id} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: item.isDuplicate ? '#f43f5e' : '#60a5fa', fontWeight: '700' }}>
                          {item.source} • {item.isDuplicate ? 'DUPLICATE BLOCKED' : `${Math.round(item.matchConfidence * 100)}% Match`}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginTop: '2px' }}>
                          {item.rawTitle.slice(0, 50)}...
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : item.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.status === 'VERIFIED' ? '#34d399' : item.status === 'REJECTED' ? '#f43f5e' : '#fbbf24',
                        fontWeight: '700'
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Accreditation Data Readiness</h3>
                  <button 
                    onClick={() => setActiveTab('accreditation')} 
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Reporting <ArrowRight size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>NAAC Criterion 3 (5-Year Window)</span>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>98% Ready</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '4px', backgroundColor: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ width: '98%', height: '100%', backgroundColor: '#10b981' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>NBA Criterion 5.3 (CAY Rolling SAR)</span>
                      <span style={{ color: '#06b6d4', fontWeight: '700' }}>94% Ready</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '4px', backgroundColor: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ width: '94%', height: '100%', backgroundColor: '#06b6d4' }} />
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                    📌 <strong>Traceability Rule:</strong> All 7 master records have cryptographically verifiable evidence document attachments.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAGING & VERIFICATION QUEUE */}
        {activeTab === 'staging' && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Staging Layer & Verification Gate</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  External records are normalized, matched against faculty profiles, and screened for duplicate DOIs before promotion.
                </p>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa',
                fontWeight: '700'
              }}>
                Staging Isolation: Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stagingList.map((item) => (
                <div key={item.id} style={{
                  padding: '18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: item.isDuplicate ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#1e293b',
                        color: '#93c5fd',
                        fontWeight: '700'
                      }}>
                        SOURCE: {item.source}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.isDuplicate ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: item.isDuplicate ? '#f43f5e' : '#34d399',
                        fontWeight: '700'
                      }}>
                        {item.isDuplicate ? 'DUPLICATE COLLISION' : `MATCH: ${item.matchMethod} (${Math.round(item.matchConfidence * 100)}%)`}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: item.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : item.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.status === 'VERIFIED' ? '#34d399' : item.status === 'REJECTED' ? '#f43f5e' : '#fbbf24',
                      fontWeight: '700'
                    }}>
                      STATUS: {item.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{item.rawTitle}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Assigned Faculty:</span> <strong style={{ color: '#e2e8f0' }}>{item.matchedFaculty}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Normalized DOI:</span> <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{item.normalizedDoi}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Evidence Vault:</span> <a href={item.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline' }}>Reprint PDF File</a>
                    </div>
                  </div>

                  {item.isDuplicate && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      color: '#f87171',
                      fontSize: '12px',
                      marginBottom: '12px'
                    }}>
                      ⚠️ {item.duplicateReason}
                    </div>
                  )}

                  {/* Governance Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {currentRole !== 'FACULTY' ? (
                      <>
                        {item.status === 'PENDING_REVIEW' && (
                          <>
                            <button 
                              onClick={() => handleVerifyAndCommit(item)}
                              disabled={item.isDuplicate}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '6px',
                                backgroundColor: item.isDuplicate ? '#334155' : '#10b981',
                                color: '#fff',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: item.isDuplicate ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Check size={14} />
                              Verify & Promote to Master DB
                            </button>
                            <button 
                              onClick={() => handleDismissRecord(item.id)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                                color: '#f43f5e',
                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <X size={14} />
                              Reject / Flag
                            </button>
                          </>
                        )}
                        {item.status === 'VERIFIED' && (
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                            ✓ Verified and committed to Master Database
                          </span>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                        <Lock size={12} />
                        <span>Approval requires Research Coordinator or Dean Research privilege</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MASTER RESEARCH DATABASE (ALL 7 CATEGORIES) */}
        {activeTab === 'master_db' && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Master Research Database (All 7 Research Categories)</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  Immutable, approved records feeding both NAAC and NBA reporting engines simultaneously.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleExportAccreditationExcel('Master_Research')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} color="#10b981" /> Export Master XLSX
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input 
                  type="text"
                  placeholder="Search by title, faculty, DOI, or publisher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Categories ({masterList.length})</option>
                <option value="JOURNAL">1. Journals</option>
                <option value="CONFERENCE">2. Conferences</option>
                <option value="BOOK">3. Books / Chapters</option>
                <option value="PATENT">4. Patents & IPR</option>
                <option value="PROJECT">5. Sponsored Projects</option>
                <option value="CONSULTANCY">6. Consultancy</option>
                <option value="ACTIVITY">7. Academic Activities</option>
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f293d', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 8px' }}>Category</th>
                    <th style={{ padding: '12px 8px' }}>Title & Venue / Grant Body</th>
                    <th style={{ padding: '12px 8px' }}>Faculty / Dept</th>
                    <th style={{ padding: '12px 8px' }}>Academic Year</th>
                    <th style={{ padding: '12px 8px' }}>Indexing / Status</th>
                    <th style={{ padding: '12px 8px' }}>Evidence</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaster.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: row.category === 'JOURNAL' ? 'rgba(59, 130, 246, 0.15)' :
                                          row.category === 'CONFERENCE' ? 'rgba(6, 182, 212, 0.15)' :
                                          row.category === 'BOOK' ? 'rgba(168, 85, 247, 0.15)' :
                                          row.category === 'PATENT' ? 'rgba(245, 158, 11, 0.15)' :
                                          row.category === 'PROJECT' ? 'rgba(16, 185, 129, 0.15)' :
                                          'rgba(244, 63, 94, 0.15)',
                          color: row.category === 'JOURNAL' ? '#60a5fa' :
                                row.category === 'CONFERENCE' ? '#22d3ee' :
                                row.category === 'BOOK' ? '#c084fc' :
                                row.category === 'PATENT' ? '#fbbf24' :
                                row.category === 'PROJECT' ? '#34d399' :
                                '#fb7185'
                        }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', maxWidth: '340px' }}>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{row.title}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{row.venueOrPublisher}</div>
                        {row.fundingAmount && (
                          <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', marginTop: '2px' }}>
                            Grant Amount: {row.fundingAmount}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{row.facultyName}</div>
                        <div style={{ fontSize: '11px', color: '#60a5fa' }}>{row.department}</div>
                      </td>
                      <td style={{ padding: '14px 8px', fontWeight: '700' }}>{row.academicYear}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', fontWeight: '600' }}>
                          {row.quartileOrIndexing}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <a href={row.evidenceUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#06b6d4', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={12} /> Verified PDF
                        </a>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '700' }}>
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INGESTION & CONNECTORS CENTER (STAGES 9-11) */}
        {activeTab === 'import_center' && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Data Ingestion & Integration Hub</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  Authorized API connectors for ORCID v3.0, Elsevier Scopus API, and bulk CSV migration.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* ORCID Box */}
              <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#60a5fa', fontSize: '15px', fontWeight: '700' }}>ORCID Public API v3.0</h4>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px', fontWeight: '700' }}>CONNECTED</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
                  Synchronizes researcher activity across all registered faculty ORCID identifiers. Fetched records enter the Staging queue.
                </p>
                <button 
                  onClick={() => {
                    showToast('🔄 Invoking ORCID API v3.0... 2 new works staged for Dr. Ramesh Sharma');
                    setActiveTab('staging');
                  }} 
                  style={{
                    fontSize: '12px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Sync All Faculty ORCIDs
                </button>
              </div>

              {/* Scopus Box */}
              <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#06b6d4', fontSize: '15px', fontWeight: '700' }}>Elsevier Scopus API</h4>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px', fontWeight: '700' }}>INSTITUTIONAL KEY</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
                  Queries indexed citations, quartile classifications (Q1-Q4), and author metrics using DSU institutional entitlements.
                </p>
                <button 
                  onClick={() => {
                    showToast('🔄 Invoking Scopus Author Retrieval API... Staged 1 new Q1 article');
                    setActiveTab('staging');
                  }} 
                  style={{
                    fontSize: '12px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Sync Scopus Author Registry
                </button>
              </div>
            </div>

            {/* CSV File Drag & Drop Simulation */}
            <div style={{ padding: '24px', borderRadius: '10px', border: '2px dashed #3b82f6', background: 'rgba(59, 130, 246, 0.03)', textAlign: 'center' }}>
              <UploadCloud size={36} color="#3b82f6" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Batch Spreadsheet Upload (Excel / CSV)</h4>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                Upload legacy departmental spreadsheets. Automatic parser standardizes headers, verifies DOIs, and flags duplicates.
              </p>
              <button 
                onClick={() => {
                  showToast('📥 Ingested sample spreadsheet: 4 valid rows sent to staging, 1 duplicate flagged.');
                  setActiveTab('staging');
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Upload & Deduplicate Spreadsheet
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: ACCREDITATION ENGINES (NAAC & NBA) */}
        {activeTab === 'accreditation' && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Accreditation Criteria Mapping & Reporting Engines</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  Decoupled reporting modules consuming the exact same verified Master Research Database.
                </p>
              </div>

              {/* Framework Switcher */}
              <div style={{
                display: 'flex',
                borderRadius: '8px',
                backgroundColor: '#1f2937',
                padding: '4px',
                border: '1px solid #1f293d'
              }}>
                <button
                  onClick={() => setAccreditationType('NAAC')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: accreditationType === 'NAAC' ? '#3b82f6' : 'transparent',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  NAAC (Institutional Engine)
                </button>
                <button
                  onClick={() => setAccreditationType('NBA')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: accreditationType === 'NBA' ? '#06b6d4' : 'transparent',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  NBA (Program SAR Engine)
                </button>
              </div>
            </div>

            {/* NAAC ENGINE VIEW */}
            {accreditationType === 'NAAC' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#93c5fd' }}>
                        NAAC University Manual 2024 (Binary Accreditation Ready)
                      </h4>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        Scope: Institution-Wide • Assessment Window: 5-Year Cumulative Rolling (2021-22 to 2025-26)
                      </p>
                    </div>
                    {(currentRole === 'SUPER_ADMIN' || currentRole === 'RESEARCH_ADMIN') && (
                      <button 
                        onClick={() => handleExportAccreditationExcel('NAAC')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={14} /> Download NAAC Data Template (XLSX)
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {[
                    {
                      code: 'Criterion 3.4.3',
                      title: 'Research papers per teacher in journals notified on UGC CARE / Scopus',
                      value: '1.04 papers / teacher / year',
                      ratio: '148 verified scopus papers across 142 faculty members',
                      target: 'Target: >= 1.0 (Full Score)',
                      evidenceStatus: '145 / 148 Verified Reprints Attached',
                    },
                    {
                      code: 'Criterion 3.4.5',
                      title: 'Bibliometrics based on average Citation Index in Scopus/WoS',
                      value: '12.95 average citations / indexed paper',
                      ratio: '1,450 total citations on 112 Scopus publications',
                      target: 'Target: >= 10.0 (Full Score)',
                      evidenceStatus: 'Scopus Citation Extract Linked',
                    },
                    {
                      code: 'Criterion 3.1.2',
                      title: 'Percentage of departments with research grants sanctioned',
                      value: '85.7% (12 of 14 academic departments)',
                      ratio: '₹4.82 Cr sanctioned from SERB, DST, and Industry',
                      target: 'Target: >= 75%',
                      evidenceStatus: 'Sanction Letters Verified',
                    },
                    {
                      code: 'Criterion 3.4.2',
                      title: 'Patents published and granted in the assessment window',
                      value: '38 Total Patents (14 Granted, 24 Published)',
                      ratio: 'Score: 14 + (0.5 * 24) = 26 Achievement Points',
                      target: 'Criterion Target Met',
                      evidenceStatus: 'IP Gazette Notifications Attached',
                    },
                  ].map((metric, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa' }}>{metric.code}</span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>{metric.target}</span>
                      </div>
                      <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>{metric.title}</h5>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '700', marginBottom: '4px' }}>{metric.value}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{metric.ratio}</div>
                      <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileCheck size={12} /> {metric.evidenceStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NBA ENGINE VIEW */}
            {accreditationType === 'NBA' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#67e8f9' }}>
                        NBA Tier-I UG Engineering SAR Engine (Criterion 5)
                      </h4>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        Scope: Program / Department (B.Tech CSE) • Window: 3-Year Rolling SAR (CAY: 2025-26, CAYm1: 2024-25, CAYm2: 2023-24)
                      </p>
                    </div>
                    {currentRole !== 'FACULTY' && (
                      <button 
                        onClick={() => handleExportAccreditationExcel('NBA')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#0891b2',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={14} /> Export NBA SAR Section (XLSX)
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {[
                    {
                      code: 'Criterion 5.1',
                      title: 'Student-Faculty Ratio (SFR) & Faculty Cadre Proportion',
                      metrics: 'SFR: 1:14.2 (Full 20 marks achievable <= 15:1)',
                      cadre: 'Prof: 8 • Assoc: 14 • Asst: 22 (AICTE Norms Compliant)',
                      target: '25 Marks',
                    },
                    {
                      code: 'Criterion 5.3.1',
                      title: 'Academic Research (Faculty Publications in Scopus/SCI)',
                      metrics: '43 Indexed Papers in 3-Year Window (CAY: 18, CAYm1: 15, CAYm2: 10)',
                      cadre: 'Assessment FP = 14.2 / 15 Marks',
                      target: '15 Marks',
                    },
                    {
                      code: 'Criterion 5.3.2',
                      title: 'Sponsored Research Projects (Amount Sanctioned)',
                      metrics: '₹84.5 Lakhs cumulative research grants in department',
                      cadre: '5 Active Sponsored Projects with Govt/Industry',
                      target: '10 Marks',
                    },
                    {
                      code: 'Criterion 5.3.3',
                      title: 'Development Activities, Consultancy & Patents',
                      metrics: '6 Granted Patents + ₹18.2 Lakhs Consultancy Revenue',
                      cadre: 'Industrial MoUs & Product Prototypes on record',
                      target: '5 Marks',
                    },
                  ].map((crit, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#06b6d4' }}>{crit.code}</span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>{crit.target}</span>
                      </div>
                      <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>{crit.title}</h5>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '700', marginBottom: '4px' }}>{crit.metrics}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{crit.cadre}</div>
                      <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileCheck size={12} /> Consuming verified DSU Master Database
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FACULTY DIRECTORY (WITH SLIDE-OUT PROFILE DRAWER) */}
        {activeTab === 'faculty' && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid #1f293d', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>DSU Faculty Directory & Persistent Identifiers</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  ORCID iDs and Scopus Author IDs used by Ingestion Engine for automated matching.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f293d', color: '#9ca3af' }}>
                  <th style={{ padding: '12px 8px' }}>Faculty Name</th>
                  <th style={{ padding: '12px 8px' }}>Department</th>
                  <th style={{ padding: '12px 8px' }}>ORCID iD</th>
                  <th style={{ padding: '12px 8px' }}>Scopus ID</th>
                  <th style={{ padding: '12px 8px' }}>Completeness</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: '600', color: '#fff' }}>
                      {row.name}
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'normal' }}>{row.designation}</div>
                    </td>
                    <td style={{ padding: '14px 8px' }}>{row.department}</td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: '#60a5fa' }}>{row.orcidId}</td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: '#06b6d4' }}>{row.scopusAuthorId}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
                        {row.profileCompleteness}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <button 
                        onClick={() => setSelectedFaculty(row)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid #3b82f6',
                          color: '#93c5fd',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={12} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Slide-out Faculty Research Profile Drawer (Section 8) */}
      {selectedFaculty && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '560px',
          height: '100vh',
          backgroundColor: '#0f172a',
          borderLeft: '1px solid #1f293d',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
          padding: '32px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1f293d', paddingBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Faculty Research Profile</h2>
            <button 
              onClick={() => setSelectedFaculty(null)} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '800',
              color: '#fff'
            }}>
              {selectedFaculty.name.split(' ').map(n => n[0]).slice(-2).join('')}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{selectedFaculty.name}</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {selectedFaculty.designation} • {selectedFaculty.department} ({selectedFaculty.employeeId})
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #1f293d' }}>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>ORCID iD</span>
              <p style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '12px', fontWeight: '700' }}>
                {selectedFaculty.orcidId}
              </p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #1f293d' }}>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>Scopus Author ID</span>
              <p style={{ fontFamily: 'monospace', color: '#06b6d4', fontSize: '12px', fontWeight: '700' }}>
                {selectedFaculty.scopusAuthorId}
              </p>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Verified Master Portfolio Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa' }}>{selectedFaculty.journalCount}</span>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Journals</p>
            </div>
            <div style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{selectedFaculty.patentCount}</span>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Patents</p>
            </div>
            <div style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{selectedFaculty.grantsAmount}</span>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Grants</p>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Linked Master Database Records</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {masterList
              .filter(m => m.facultyName.toLowerCase().includes(selectedFaculty.name.split(' ')[1].toLowerCase()))
              .map(record => (
                <div key={record.id} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1f293d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '700' }}>{record.category}</span>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>{record.academicYear}</span>
                  </div>
                  <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{record.title}</h5>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    {record.venueOrPublisher} • ID: {record.doiOrIdentifier}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add New Research Record Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            width: '540px',
            padding: '28px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Log Master Research Record</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Research Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ResearchCategory)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                >
                  <option value="JOURNAL">1. Journal Article (Peer-Reviewed)</option>
                  <option value="CONFERENCE">2. Conference Proceedings</option>
                  <option value="BOOK">3. Book / Book Chapter</option>
                  <option value="PATENT">4. Patent / Intellectual Property</option>
                  <option value="PROJECT">5. Sponsored Research Project</option>
                  <option value="CONSULTANCY">6. Industry Consultancy</option>
                  <option value="ACTIVITY">7. Academic FDP / Activity</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Title of Work</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Robust Decentralized Control in Smart Microgrids"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Faculty Lead</label>
                  <select
                    value={newFaculty}
                    onChange={(e) => setNewFaculty(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                  >
                    <option value="Dr. Ramesh Sharma">Dr. Ramesh Sharma (CSE)</option>
                    <option value="Dr. Ananya Iyer">Dr. Ananya Iyer (ECE)</option>
                    <option value="Dr. Vikram Malhotra">Dr. Vikram Malhotra (AI & ML)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Academic Year</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                  >
                    <option value="2025-26">2025-26 (CAY)</option>
                    <option value="2024-25">2024-25 (CAYm1)</option>
                    <option value="2023-24">2023-24 (CAYm2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Journal / Conference / Granting Agency</label>
                <input 
                  type="text" 
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. IEEE Transactions / SERB / Springer"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>DOI / Patent Number / Sanction ID</label>
                <input 
                  type="text" 
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  placeholder="e.g. 10.1109/TSG.2025.1098234"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddManualRecord}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#2563eb', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Verify & Commit Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
