import React, { useState } from 'react';
import {
  CitizenRequest,
  ExistingFacility,
  InfrastructureGap,
  DevelopmentProject,
  PriorityWeights,
  UserProfile,
  InfrastructureCategory,
  SeverityLevel,
} from '../../types';
import { DemandMap } from './DemandMap';
import { RequestsTable } from './RequestsTable';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { PriorityEngineView } from './PriorityEngineView';
import { ProjectTracker } from './ProjectTracker';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileText,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  TrendingUp,
} from 'lucide-react';

interface AuthorityConsoleProps {
  currentUser: UserProfile;
  requests: CitizenRequest[];
  gaps: InfrastructureGap[];
  existingFacilities: ExistingFacility[];
  projects: DevelopmentProject[];
  weights: PriorityWeights;
  onVerifyAndApprove: (
    requestId: string,
    adjustedCategory?: InfrastructureCategory,
    adjustedSeverity?: SeverityLevel,
    notes?: string
  ) => void;
  onCreateProjectFromGap: (gap: InfrastructureGap) => void;
  activeAuthorityTab: string;
}

export const AuthorityConsole: React.FC<AuthorityConsoleProps> = ({
  currentUser,
  requests,
  gaps,
  existingFacilities,
  projects,
  weights,
  onVerifyAndApprove,
  onCreateProjectFromGap,
  activeAuthorityTab,
}) => {
  const [selectedRequestForInspection, setSelectedRequestForInspection] = useState<CitizenRequest | null>(null);
  const [selectedClusterFocus, setSelectedClusterFocus] = useState<string>(requests[0]?.id || '');
  const [activePipelineStage, setActivePipelineStage] = useState<number | null>(null);
  const [gapFilterCategory, setGapFilterCategory] = useState<string>('All');

  // Aggregated metrics
  const totalReports = requests.reduce((acc, r) => acc + (r.clusterCount || 1), 0);
  const verifiedCount = requests.filter((r) => r.isVerifiedByHuman).length;
  const pendingCount = requests.filter((r) => !r.isVerifiedByHuman).length;
  const criticalGapsCount = gaps.filter((g) => g.gapSeverity === 'Critical').length;
  const totalCapExNeeded = gaps.reduce((acc, g) => acc + g.estimatedCapitalCostUsd, 0);
  const totalSanctionedBudget = projects.reduce((acc, p) => acc + p.budgetAllocatedUsd, 0);

  // Top priority ranking
  const priorityRanked = [...requests].sort(
    (a, b) => b.priorityScore.overallScore - a.priorityScore.overallScore
  );
  const urgentDossiers = priorityRanked.slice(0, 4);

  // Filtered gaps
  const displayedGaps = gapFilterCategory === 'All'
    ? gaps
    : gaps.filter((g) => g.category === gapFilterCategory);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP COMMAND BAR (COMPACT, EDITORIAL, NOT A GIANT EMPTY TITLE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>Civic Decision-Support System • Federated BRICS Node</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-600 font-normal">Session: {currentUser.name} ({currentUser.badgeNumber})</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Infrastructure Intelligence Command
            </h1>
            <span className="text-xs font-mono font-medium text-slate-500 hidden sm:inline">
              [Rayagada & Eastern Corridor Zone]
            </span>
          </div>
        </div>

        {/* Quick Context Controls */}
        <div className="flex items-center gap-2 text-xs self-start md:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Real-time Ingestion</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Sync: 2m ago</span>
          </div>
        </div>
      </div>

      {/* RENDER BY SELECTED TAB */}
      {activeAuthorityTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 2. THE INFRASTRUCTURE INTELLIGENCE STORYLINE PIPELINE STRIP */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Sovereign Governance Lifecycle Pipeline
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any stage to filter perspective
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {[
                {
                  step: '01',
                  label: 'Citizen Ingestion',
                  val: `${totalReports} Reports`,
                  sub: 'Multimodal / 5 Languages',
                  status: 'Active',
                  color: 'text-blue-700 bg-blue-50 border-blue-200',
                },
                {
                  step: '02',
                  label: 'AI & CV Extraction',
                  val: '96.8% Confidence',
                  sub: 'Bounding Boxes & OCR',
                  status: 'Automated',
                  color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
                },
                {
                  step: '03',
                  label: 'Evidence Authenticity',
                  val: 'SHA-256 Digest',
                  sub: 'EXIF Match & Sensor Noise',
                  status: 'Verified',
                  color: 'text-slate-800 bg-slate-100 border-slate-300',
                },
                {
                  step: '04',
                  label: 'Demographic Gaps',
                  val: `${gaps.length} Deficit Corridors`,
                  sub: 'Census 2026 Synthesis',
                  status: 'Identified',
                  color: 'text-amber-800 bg-amber-50 border-amber-200',
                },
                {
                  step: '05',
                  label: 'Priority Engine',
                  val: 'Weighted Index',
                  sub: 'Transparent Decision Aid',
                  status: 'Calibrated',
                  color: 'text-purple-800 bg-purple-50 border-purple-200',
                },
                {
                  step: '06',
                  label: 'Sanctioned Projects',
                  val: `$${(totalSanctionedBudget / 1000000).toFixed(1)}M Sanctioned`,
                  sub: `${projects.length} Active Public Works`,
                  status: 'Enforced',
                  color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
                },
              ].map((p, idx) => (
                <div
                  key={p.step}
                  onClick={() => setActivePipelineStage(activePipelineStage === idx ? null : idx)}
                  className={`p-2.5 rounded border transition cursor-pointer hover:border-slate-400 ${
                    activePipelineStage === idx
                      ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>{p.step}</span>
                    <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] border ${p.color}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate">{p.label}</div>
                  <div className="font-mono font-semibold text-slate-800 text-[11px] mt-0.5">{p.val}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BLOOMBERG-STYLE COMPACT INTELLIGENCE METRIC STRIP (NOT 4 GIANT FLOATING CARDS!) */}
          <div className="bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 shadow-2xs text-xs">
            <div className="p-3 sm:p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Citizen Demand Volume
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{totalReports}</span>
                <span className="text-[11px] text-emerald-700 font-semibold font-mono">+28 reports (24h)</span>
              </div>
              <div className="text-[10px] text-slate-500">Across 5 deduplicated clusters</div>
            </div>

            <div className="p-3 sm:p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Human Verification
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700">{verifiedCount}</span>
                <span className="text-[11px] text-amber-700 font-semibold font-mono">/ {pendingCount} pending</span>
              </div>
              <div className="text-[10px] text-slate-500">80% ground truth resolution</div>
            </div>

            <div className="p-3 sm:p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Census Deficit Gaps
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-red-700">{gaps.length}</span>
                <span className="text-[11px] text-red-600 font-semibold font-mono">({criticalGapsCount} critical)</span>
              </div>
              <div className="text-[10px] text-slate-500">Demographic ratio vs Census 2026</div>
            </div>

            <div className="p-3 sm:p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Identified CapEx Deficit
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  ${(totalCapExNeeded / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                ${(totalSanctionedBudget / 1000000).toFixed(1)}M sanctioned in projects
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Evidence Integrity
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-indigo-700">96.8%</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono font-semibold">
                  SHA-256
                </span>
              </div>
              <div className="text-[10px] text-slate-500">Zero synthetic/deepfake artifacts</div>
            </div>
          </div>

          {/* 4. PRIMARY INTELLIGENCE COMMAND ARENA (MAP AS VISUAL ANCHOR + PRIORITY DOSSIERS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* LEFT / CENTER: GEOSPATIAL MAP VIEWPORT (68% OF ARENA) */}
            <div className="lg:col-span-8 flex flex-col min-w-0">
              {/* Map Header Strip */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-900">Geospatial Intelligence Surface</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-mono text-[11px]">Carto Positron Layer • 5 Demand Clusters</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Coordinates: 19.25°N, 83.25°E
                </div>
              </div>

              {/* Leaflet Map Visual Anchor */}
              <div className="flex-1 w-full relative min-h-[460px]">
                <DemandMap
                  requests={requests}
                  gaps={gaps}
                  existingFacilities={existingFacilities}
                  projects={projects}
                  selectedRequestId={selectedClusterFocus}
                  onSelectRequest={(req) => {
                    setSelectedClusterFocus(req.id);
                    setSelectedRequestForInspection(req);
                  }}
                  heightClassName="h-[460px] sm:h-[500px]"
                  showFiltersHeader={true}
                />
              </div>

              {/* Map Active Focus Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 min-w-0">
                  <span className="font-semibold text-slate-900 shrink-0">Active Hotspot Focus:</span>
                  <span className="font-mono text-blue-700 font-bold shrink-0">BRICS-DPI-2026-9041</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 truncate">
                    Kashipur Block Healthcare Deficit (20,000 citizens • 50km to nearest hospital)
                  </span>
                </div>

                <button
                  onClick={() => {
                    const req = requests.find((r) => r.id === 'BRICS-DPI-2026-9041') || requests[0];
                    setSelectedRequestForInspection(req);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Inspect Full Dossier →
                </button>
              </div>
            </div>

            {/* RIGHT: PRIORITY DECISION DOSSIERS & VERIFICATION FEED (32% OF ARENA) */}
            <div className="lg:col-span-4 flex flex-col bg-slate-50/40 min-w-0 divide-y divide-slate-200">
              <div className="p-3.5 bg-slate-100/70 flex items-center justify-between border-b border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Priority Decision Signals</div>
                  <div className="text-[11px] text-slate-500">Ranked by Transparent 5-Factor Formula</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {urgentDossiers.length} URGENT
                </span>
              </div>

              {/* Dossier Item List */}
              <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px]">
                {urgentDossiers.map((req, idx) => {
                  const isSelected = selectedClusterFocus === req.id;
                  const isUrgent = req.priorityScore.indicatorLevel === 'Urgent';
                  const score = req.priorityScore.overallScore;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedClusterFocus(req.id)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-600 ring-1 ring-blue-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Top: Rank + ID + Score */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-800 truncate">
                            {req.id}
                          </span>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 border ${
                            isUrgent
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {score}/100 {req.priorityScore.indicatorLevel}
                        </span>
                      </div>

                      {/* Category & Location */}
                      <div className="font-semibold text-xs text-slate-900">
                        {req.reportedCategory} — {req.reportedLocation.district}
                      </div>

                      {/* Key Citizen Demand quote snippet */}
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed italic">
                        "{req.structuredExtraction.canonicalEnglishTranslation || req.originalText}"
                      </div>

                      {/* Demand Signals & Status */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                        <span>{req.clusterCount} citizen reports</span>
                        <span
                          className={
                            req.isVerifiedByHuman
                              ? 'text-emerald-700 font-semibold'
                              : 'text-amber-700 font-semibold'
                          }
                        >
                          {req.isVerifiedByHuman ? '● Human Verified' : '○ Pending Sign-off'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestForInspection(req);
                          }}
                          className="flex-1 py-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition cursor-pointer"
                        >
                          Inspect Evidence
                        </button>

                        {!req.isVerifiedByHuman && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVerifyAndApprove(req.id, undefined, undefined, 'Ground truth confirmed in triage');
                            }}
                            className="flex-1 py-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                          >
                            1-Click Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Formula Footnote */}
              <div className="p-3 bg-slate-50 text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Formula Rule:</span> Demand (
                {(weights.citizenDemandWeight * 100).toFixed(0)}%) + Gap (
                {(weights.infrastructureGapWeight * 100).toFixed(0)}%) + Pop (
                {(weights.populationImpactWeight * 100).toFixed(0)}%) + Severity (
                {(weights.severityWeight * 100).toFixed(0)}%) + Alignment (
                {(weights.planAlignmentWeight * 100).toFixed(0)}%). Decision aid only.
              </div>
            </div>
          </div>

          {/* 5. SECONDARY INFORMATION ARCHITECTURE (OPEN TABULAR LAYOUT — NO GENERIC CARD SOUP!) */}
          <div className="space-y-4">
            {/* SECTION A: INFRASTRUCTURE GAP & CENSUS SYNTHESIS MATRIX */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <h2 className="font-bold text-slate-900 text-sm">
                      Infrastructure Gap & Demographic Deficit Matrix
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Official Census 2026 demographic equity standards cross-referenced with municipal asset registries.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Filter Sector:</span>
                  <select
                    value={gapFilterCategory}
                    onChange={(e) => setGapFilterCategory(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="All">All Categories ({gaps.length})</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Roads & Bridges">Roads & Bridges</option>
                    <option value="Clean Water & Sanitation">Clean Water</option>
                    <option value="Flood & Storm Drainage">Flood Drainage</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              {/* Deficit Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-2.5 px-4">Corridor & Category</th>
                      <th className="py-2.5 px-4">Citizen Demand</th>
                      <th className="py-2.5 px-4">Official Demographic Norm</th>
                      <th className="py-2.5 px-4">Calculated Deficit vs Ground Truth</th>
                      <th className="py-2.5 px-4">Severity & Gap Index</th>
                      <th className="py-2.5 px-4 text-right">CapEx Needed</th>
                      <th className="py-2.5 px-4 text-right">Authority Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayedGaps.map((gap) => {
                      const isCritical = gap.gapSeverity === 'Critical';

                      return (
                        <tr key={gap.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{gap.category}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {gap.district} ({gap.region})
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-medium">
                            <span className="text-slate-900 font-bold">{gap.aggregateDemandRequests}</span>
                            <span className="text-slate-500 text-[11px]"> citizen submissions</span>
                          </td>

                          <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                            {gap.recommendedNormRatio}
                          </td>

                          <td className="py-3 px-4 text-[11px] text-slate-800 max-w-xs leading-relaxed font-medium">
                            {gap.currentDeficit}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                isCritical
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {gap.gapIndex.toFixed(0)}/100 {gap.gapSeverity}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ${(gap.estimatedCapitalCostUsd / 1000000).toFixed(2)}M
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onCreateProjectFromGap(gap)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <span>Sanction Works</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION B: ACTIVE DEVELOPMENT PROJECTS & IMPACT FEEDBACK LOOP */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h2 className="font-bold text-slate-900 text-sm">
                      Sanctioned Capital Works & Post-Delivery Impact
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Closing the public loop: linking citizen requests to funded public works and verified complaint reduction.
                  </p>
                </div>

                <span className="font-mono text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-2 py-1 rounded">
                  {projects.length} Active Capital Projects
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {projects.map((proj) => {
                  const hasImpact = !!proj.impactPostCommissioning;

                  return (
                    <div key={proj.id} className="p-4 hover:bg-slate-50/50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{proj.code}</span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                              proj.status === 'Commissioned'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : proj.status === 'Under Construction'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-slate-900">
                          Sanctioned Budget: ${proj.budgetAllocatedUsd.toLocaleString()} USD
                        </div>
                      </div>

                      <div className="font-bold text-slate-900 text-sm mb-1">{proj.title}</div>
                      <div className="text-xs text-slate-500 mb-3">
                        Lead Ministry: {proj.leadMinistry} • District: {proj.district} • Target Completion:{' '}
                        {proj.targetCompletionDate}
                      </div>

                      {/* Before / After Impact comparison strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                            Pre-Works Baseline Deficit
                          </span>
                          <div className="text-slate-800 font-medium">
                            {proj.impactBaseline.accessDeficitMetric}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Baseline Citizen Complaints: {proj.impactBaseline.monthlyCitizenComplaints}/mo
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                            Measured Service Improvement
                          </span>
                          {hasImpact ? (
                            <>
                              <div className="text-emerald-800 font-bold">
                                {proj.impactPostCommissioning?.measuredServiceImprovement}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                                Verified Reduction:{' '}
                                {proj.impactPostCommissioning?.verifiedReductionPercentage}% • Satisfaction:{' '}
                                {proj.impactPostCommissioning?.citizenSatisfactionRate}%
                              </div>
                            </>
                          ) : (
                            <div className="text-slate-400 italic text-[11px]">
                              Project in {proj.status} stage. Telemetry sensors deploying.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REQUESTS TAB */}
      {activeAuthorityTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Citizen Ingestion Queue</h2>
              <p className="text-xs text-slate-500">
                Verbatim citizen submissions, multilingual canonical translations, and cryptographic evidence hashes.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              Total Ingested: {requests.length} Dossiers
            </span>
          </div>
          <RequestsTable
            requests={requests}
            onInspectRequest={(req) => setSelectedRequestForInspection(req)}
            onQuickVerify={(id) => onVerifyAndApprove(id, undefined, undefined, 'Verified by ground officer')}
          />
        </div>
      )}

      {/* VIEW: HOTSPOTS TAB */}
      {activeAuthorityTab === 'hotspots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Geospatial Intelligence Surface</h2>
              <p className="text-xs text-slate-500">
                Spatial clustering of citizen demand density, census deficit polygons, and public facility GPS coordinates.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              Active Focus: Rayagada District
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <DemandMap
              requests={requests}
              gaps={gaps}
              existingFacilities={existingFacilities}
              projects={projects}
              selectedRequestId={selectedClusterFocus}
              onSelectRequest={(req) => {
                setSelectedClusterFocus(req.id);
                setSelectedRequestForInspection(req);
              }}
              heightClassName="h-[600px]"
              showFiltersHeader={true}
            />
          </div>
        </div>
      )}

      {/* VIEW: EVIDENCE & PRIORITY TAB */}
      {activeAuthorityTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Multimodal Computer Vision & Explainable Priority Engine
              </h2>
              <p className="text-xs text-slate-500">
                Inspect AI bounding boxes, perceptual hashes, and examine the exact weighted formula explanation.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Explainable Decision Aid
            </span>
          </div>
          <PriorityEngineView
            requests={requests}
            weights={weights}
            onVerifyRequest={(id, notes) => onVerifyAndApprove(id, undefined, undefined, notes)}
          />
        </div>
      )}

      {/* VIEW: PROJECTS TAB */}
      {activeAuthorityTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Capital Projects Delivery & Public Ledger</h2>
              <p className="text-xs text-slate-500">
                Transforming citizen evidence into funded public works with post-commissioning service delta verification.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">
              Total Committed: ${(totalSanctionedBudget / 1000000).toFixed(2)}M USD
            </span>
          </div>
          <ProjectTracker projects={projects} />
        </div>
      )}

      {/* EVIDENCE VIEWER MODAL */}
      {selectedRequestForInspection && (
        <EvidenceViewerModal
          request={selectedRequestForInspection}
          onClose={() => setSelectedRequestForInspection(null)}
          onVerifyAndApprove={onVerifyAndApprove}
          currentUserRole={currentUser.role}
          currentUserName={currentUser.name}
        />
      )}
    </div>
  );
};
