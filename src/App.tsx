import React, { useState } from 'react';
import {
  CitizenRequest,
  InfrastructureGap,
  ExistingFacility,
  DevelopmentProject,
  PriorityWeights,
  UserProfile,
  InfrastructureCategory,
  SeverityLevel,
  AuditLogEntry,
  Role,
} from './types';
import {
  MOCK_CITIZEN_REQUESTS,
  MOCK_EXISTING_FACILITIES,
  MOCK_INFRASTRUCTURE_GAPS,
  MOCK_DEVELOPMENT_PROJECTS,
  MOCK_USERS,
  INITIAL_WEIGHTS,
  MOCK_AUDIT_LOGS,
} from './data/mockData';
import {
  processNewCitizenSubmission,
  calculateExplainablePriority,
} from './services/aiPipeline';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal/CitizenPortal';
import { AuthorityConsole } from './components/AuthorityConsole/AuthorityConsole';
import { AdminConsole } from './components/AdminConsole/AdminConsole';
import { GuidedTourModal } from './components/GuidedTourModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';

export default function App() {
  // Core Platform State
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [activeView, setActiveView] = useState<'authority' | 'citizen'>('authority');
  const [authorityTab, setAuthorityTab] = useState<string>('dashboard');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Domain Data State
  const [requests, setRequests] = useState<CitizenRequest[]>(MOCK_CITIZEN_REQUESTS);
  const [gaps, setGaps] = useState<InfrastructureGap[]>(MOCK_INFRASTRUCTURE_GAPS);
  const [existingFacilities] = useState<ExistingFacility[]>(MOCK_EXISTING_FACILITIES);
  const [projects, setProjects] = useState<DevelopmentProject[]>(MOCK_DEVELOPMENT_PROJECTS);
  const [weights, setWeights] = useState<PriorityWeights>(INITIAL_WEIGHTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);

  // Modals & UI Transitions
  const [showTourModal, setShowTourModal] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [latestSubmittedRequest, setLatestSubmittedRequest] = useState<CitizenRequest | null>(null);

  // Handle citizen submission
  const handleSubmitRequest = (data: {
    text: string;
    category: InfrastructureCategory;
    location: {
      name: string;
      lat: number;
      lng: number;
      district: string;
      region: string;
    };
    files: File[];
    audioBlobUrl?: string;
    audioTranscript?: string;
  }) => {
    setIsSubmitting(true);

    setTimeout(() => {
      const newRequest = processNewCitizenSubmission(
        data.text,
        data.category,
        data.location,
        data.files,
        weights,
        data.audioBlobUrl,
        data.audioTranscript
      );

      // Prepend to requests list
      setRequests((prev) => [newRequest, ...prev]);
      setLatestSubmittedRequest(newRequest);

      // Add sovereign audit log entry
      const auditEntry: AuditLogEntry = {
        id: `log-${Date.now().toString(16)}`,
        timestamp: new Date().toISOString(),
        actor: `Citizen Session (${data.location.district})`,
        actorRole: 'citizen',
        action: 'CITIZEN_MULTIMODAL_INGESTION',
        targetEntityId: newRequest.id,
        details: `Report submitted for ${data.category} at ${data.location.name}. Attached evidence processed: ${newRequest.evidenceList.length} items. AI extraction confidence: ${newRequest.structuredExtraction.aiConfidenceScore}%.`,
        ipAddress: '10.128.4.19 (Public Citizen Gateway)',
        hashSignature: newRequest.evidenceList[0]?.sha256Hash || 'sha256-verified-dpi-token',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      setIsSubmitting(false);
    }, 700);
  };

  // Handle human authority verification and approval
  const handleVerifyAndApprove = (
    requestId: string,
    adjustedCategory?: InfrastructureCategory,
    adjustedSeverity?: SeverityLevel,
    notes?: string
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const hadOverride = adjustedCategory || adjustedSeverity;
        return {
          ...req,
          isVerifiedByHuman: true,
          verifiedBy: currentUser.name,
          verificationNotes: notes || 'Verified and approved by authorized municipal officer.',
          status: 'verified',
          reportedCategory: adjustedCategory || req.reportedCategory,
          structuredExtraction: {
            ...req.structuredExtraction,
            category: adjustedCategory || req.structuredExtraction.category,
            severity: adjustedSeverity || req.structuredExtraction.severity,
          },
          humanOverride: hadOverride
            ? {
                originalCategory: req.reportedCategory,
                adjustedCategory: adjustedCategory || req.reportedCategory,
                originalSeverity: req.structuredExtraction.severity,
                adjustedSeverity: adjustedSeverity || req.structuredExtraction.severity,
                reason: notes || 'Official field adjustment during ground inspection',
                timestamp: new Date().toISOString(),
                officerName: currentUser.name,
              }
            : undefined,
        };
      })
    );

    // Audit log
    const auditEntry: AuditLogEntry = {
      id: `log-${Date.now().toString(16)}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.name} (${currentUser.badgeNumber})`,
      actorRole: currentUser.role,
      action: 'HUMAN_VERIFICATION_ACCEPT',
      targetEntityId: requestId,
      details: `Officer reviewed request dossier. Verified status assigned. Notes: ${notes || 'Ground truth confirmed.'}`,
      ipAddress: '192.168.10.45 (Gov Planning VPN)',
      hashSignature: `sig-${Date.now().toString(16)}8fbc`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Handle project initiation from verified infrastructure gap
  const handleCreateProjectFromGap = (gap: InfrastructureGap) => {
    const codePrefix = gap.district
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 8)
      .toUpperCase();
    const newProject: DevelopmentProject = {
      id: `proj-${Date.now().toString(16)}`,
      code: `DPI-CAP-2026-${codePrefix}-CAPEX`,
      title: `${gap.category} Infrastructure Upgrade & Facility Expansion`,
      category: gap.category,
      district: gap.district,
      region: gap.region,
      budgetAllocatedUsd: gap.estimatedCapitalCostUsd,
      leadMinistry:
        gap.category === 'Healthcare'
          ? 'Ministry of Health & Family Welfare'
          : gap.category === 'Roads & Bridges'
          ? 'Department of Roads, Bridges & Municipal Works'
          : 'Ministry of Water Resources & Municipal Affairs',
      status: 'Planning',
      startDate: new Date().toISOString().split('T')[0],
      targetCompletionDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2)
        .toISOString()
        .split('T')[0],
      associatedGapId: gap.id,
      linkedRequestIds: requests
        .filter((r) => r.reportedCategory === gap.category)
        .slice(0, 3)
        .map((r) => r.id),
      impactBaseline: {
        monthlyCitizenComplaints: gap.aggregateDemandRequests,
        accessDeficitMetric: gap.currentDeficit,
        populationWithoutService: gap.population,
      },
    };

    setProjects((prev) => [newProject, ...prev]);

    // Update gap severity to acknowledge project sanction
    setGaps((prev) =>
      prev.map((g) =>
        g.id === gap.id ? { ...g, gapSeverity: 'Moderate', gapIndex: Math.max(40, g.gapIndex - 25) } : g
      )
    );

    // Audit log
    const auditEntry: AuditLogEntry = {
      id: `log-${Date.now().toString(16)}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.name} (${currentUser.badgeNumber})`,
      actorRole: currentUser.role,
      action: 'PROJECT_ALLOCATION_APPROVED',
      targetEntityId: newProject.code,
      details: `Allocated USD ${gap.estimatedCapitalCostUsd.toLocaleString()} from Sovereign Capital Budget to resolve deficit in ${gap.district}. Project ID: ${newProject.id}.`,
      ipAddress: '192.168.10.82 (Municipal PWD Gateway)',
      hashSignature: `sig-${Date.now().toString(16)}99ef`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Switch view to projects tracker
    setActiveView('authority');
    setAuthorityTab('projects');
  };

  // Handle updating priority engine weights
  const handleUpdateWeights = (newWeights: PriorityWeights) => {
    setWeights(newWeights);

    // Recalculate priority scores across all active requests
    setRequests((prev) =>
      prev.map((req) => {
        const bd = req.priorityScore.breakdown;
        const newScore = calculateExplainablePriority(
          bd.citizenDemandScore,
          bd.infrastructureGapScore,
          bd.populationImpactScore,
          bd.severityScore,
          bd.planAlignmentScore,
          newWeights
        );
        return {
          ...req,
          priorityScore: newScore,
        };
      })
    );

    // Audit log
    const auditEntry: AuditLogEntry = {
      id: `log-${Date.now().toString(16)}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.name} (${currentUser.badgeNumber})`,
      actorRole: currentUser.role,
      action: 'WEIGHT_CONFIG_UPDATE',
      targetEntityId: 'GLOBAL_PRIORITY_ENGINE',
      details: `Priority engine formula weights adjusted by administrator. Demand: ${newWeights.citizenDemandWeight}, Gap: ${newWeights.infrastructureGapWeight}, Population: ${newWeights.populationImpactWeight}, Severity: ${newWeights.severityWeight}, Alignment: ${newWeights.planAlignmentWeight}. All request indicators recalculated.`,
      ipAddress: '10.240.0.1 (Secretariat Bastion)',
      hashSignature: `sig-${Date.now().toString(16)}22ee`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Handle updating user role
  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }

    const auditEntry: AuditLogEntry = {
      id: `log-${Date.now().toString(16)}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.name} (${currentUser.badgeNumber})`,
      actorRole: currentUser.role,
      action: 'RBAC_ROLE_MUTATION',
      targetEntityId: userId,
      details: `Role updated to ${newRole}.`,
      ipAddress: '10.240.0.1 (Secretariat Bastion)',
      hashSignature: `sig-${Date.now().toString(16)}role`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Inspect the prominent Kashipur demo case
  const handleInspectKashipurCase = () => {
    setShowTourModal(false);
    setActiveView('authority');
    setAuthorityTab('dashboard');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP SOVEREIGN DPI NAVIGATION */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(u) => {
          setCurrentUser(u);
          if (u.role === 'citizen') {
            setActiveView('citizen');
          } else if (activeView === 'citizen') {
            setActiveView('authority');
          }
        }}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        authorityTab={authorityTab}
        onSelectAuthorityTab={(tab) => setAuthorityTab(tab)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(lang) => setSelectedLanguage(lang)}
        onOpenDemoTour={() => setShowTourModal(true)}
        onOpenArchitectureModal={() => setShowArchitectureModal(true)}
      />

      {/* 2. MAIN APPLICATION CONTENT */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeView === 'citizen' ? (
          <CitizenPortal
            allRequests={requests}
            onSubmitRequest={handleSubmitRequest}
            isSubmitting={isSubmitting}
            latestSubmittedRequest={latestSubmittedRequest}
            onClearLatestSubmitted={() => setLatestSubmittedRequest(null)}
          />
        ) : authorityTab === 'admin' ? (
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
            <AdminConsole
              weights={weights}
              onUpdateWeights={handleUpdateWeights}
              users={allUsers}
              onUpdateUserRole={handleUpdateUserRole}
              auditLogs={auditLogs}
            />
          </div>
        ) : (
          <AuthorityConsole
            currentUser={currentUser}
            requests={requests}
            gaps={gaps}
            existingFacilities={existingFacilities}
            projects={projects}
            weights={weights}
            onVerifyAndApprove={handleVerifyAndApprove}
            onCreateProjectFromGap={handleCreateProjectFromGap}
            activeAuthorityTab={authorityTab}
          />
        )}
      </main>

      {/* 3. SOVEREIGN FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto w-full">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-bold text-slate-900">InfraPulse</span>
            <span className="text-slate-300">•</span>
            <span>Multimodal Citizen-to-Governance Decision Support Platform</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
              DPG Standard 1.2 Compliant
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="text-slate-600 hover:text-blue-600 underline cursor-pointer"
            >
              System Specs & ML Pipeline
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                setActiveView('authority');
                setAuthorityTab('admin');
              }}
              className="text-slate-600 hover:text-blue-600 underline cursor-pointer"
            >
              Weights & Sovereign Audit
            </button>
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}
      {showTourModal && (
        <GuidedTourModal
          onClose={() => setShowTourModal(false)}
          onNavigateTab={(tab) => {
            if (tab === 'citizen') {
              setActiveView('citizen');
            } else {
              setActiveView('authority');
              setAuthorityTab(tab);
            }
          }}
          onInspectKashipurCase={handleInspectKashipurCase}
        />
      )}

      {showArchitectureModal && (
        <SystemArchitectureModal onClose={() => setShowArchitectureModal(false)} />
      )}
    </div>
  );
}
