import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Cpu,
  Layers,
  AlertOctagon,
  Eye,
  UserCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface GuidedTourModalProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onInspectKashipurCase: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Step 1: Citizen Multimodal Ingestion',
    icon: FileText,
    badge: 'CITIZEN PORTAL',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'Citizen reports in native language or via oral voice recording: "हमारे काशीपुर गांव में 20,000 लोग रहते हैं और यहां कोई सरकारी अस्पताल नहीं है।" (Our village has 20,000 people and there is no government hospital nearby). Location GPS is pinned and photographic field evidence is attached.',
    actionLabel: 'View Citizen Submission Portal',
    targetTab: 'citizen',
  },
  {
    step: 2,
    title: 'Step 2: Multimodal AI & Structured Extraction',
    icon: Cpu,
    badge: 'AI INGESTION PIPELINE',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'AI automatically detects language (Hindi/Odia), generates a canonical governance translation, extracts structured entities (Category: Healthcare, Severity: Critical, Population: 20,000, Type: Secondary Hospital), computes SHA-256 fingerprint, and runs computer vision detection.',
    actionLabel: 'Inspect Structured Intelligence',
    targetTab: 'authority',
  },
  {
    step: 3,
    title: 'Step 3: Cross-Dataset Sovereign Synthesis',
    icon: Layers,
    badge: 'POSTGIS & CENSUS ENGINE',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'The platform combines real-time citizen demand with official Census 2026 demographic datasets (48,500 tribal block inhabitants) and existing public facility GIS inventories (only 1 primary health post with 6 beds within 54 km).',
    actionLabel: 'View Demand Map & GIS Overlays',
    targetTab: 'authority',
  },
  {
    step: 4,
    title: 'Step 4: Automated Infrastructure Gap Detection',
    icon: AlertOctagon,
    badge: 'GAP ANALYTICS',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    description:
      'System isolates a Critical Infrastructure Gap in Kashipur Block: WHO/National norm requires 1 secondary community hospital per 30,000 citizens. Current deficit is 100 beds and zero emergency trauma units. Gap Index: 94.2/100.',
    actionLabel: 'Open Gap Analytics View',
    targetTab: 'authority',
  },
  {
    step: 5,
    title: 'Step 5: Explainable Priority Engine Indicator',
    icon: Sparkles,
    badge: 'TRANSPARENT ALGORITHM',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description:
      'The engine computes an Urgent Priority Indicator (92.8/100) using configurable administrative weights: Citizen Demand (22.0) + Deficit Gap (28.8) + Pop Impact (18.8) + Severity (14.2) + 5-Yr Alignment (9.0). Full transparent justification is displayed.',
    actionLabel: 'Inspect Explainable Priority Breakdown',
    targetTab: 'authority',
  },
  {
    step: 6,
    title: 'Step 6: Authorized Officer Evidence Inspection',
    icon: Eye,
    badge: 'HUMAN-IN-THE-LOOP',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'District Planning Officer Dr. Elena Santos inspects the evidence suite: computer vision bounding boxes on clinic overcrowding, EXIF geolocation consistency (98.6% match, <22m variance), and cryptographic SHA-256 fingerprint.',
    actionLabel: 'Launch Evidence & CV Inspector',
    targetTab: 'authority',
  },
  {
    step: 7,
    title: 'Step 7: Officer Verification & Audit Sign-Off',
    icon: UserCheck,
    badge: 'SOVEREIGN AUDIT LEDGER',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'The officer confirms the AI classification, adds field inspection notes, and officially approves the recommendation. The action is hashed and recorded into the immutable audit ledger with the officer badge number and timestamp.',
    actionLabel: 'View Verified Audit Trail',
    targetTab: 'admin',
  },
  {
    step: 8,
    title: 'Step 8: Capital Project Commissioning & Tracking',
    icon: Building2,
    badge: 'CAPITAL WORKS INTEGRATION',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'A capital development project is created: "Kashipur 50-Bed Community Hospital & Emergency Trauma Annex" (Budget: USD $2.85M). Tendering begins and public construction milestones are linked directly to citizen request clusters.',
    actionLabel: 'View Project Tracking & Budgets',
    targetTab: 'authority',
  },
  {
    step: 9,
    title: 'Step 9: Closed-Loop Post-Commissioning Impact Monitoring',
    icon: TrendingUp,
    badge: 'IMPACT AUDIT',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'After handover, the system tracks real outcome indicators. In completed projects (e.g. Nagavali Bridge & Cuttack Drainage), citizen complaints dropped by 89-92% and satisfaction reached 96.8%. Demand loop is completely closed.',
    actionLabel: 'View Before/After Impact Metrics',
    targetTab: 'authority',
  },
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  onClose,
  onNavigateTab,
  onInspectKashipurCase,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const current = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleExecuteAction = () => {
    onNavigateTab(current.targetTab);
    if (current.step === 6) {
      onInspectKashipurCase();
    }
    onClose();
  };

  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full text-slate-900 shadow-xl overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">BRICS DPI Demo Flow (9 Steps)</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Milestone <strong>{current.step}</strong> of {STEPS.length}
            </span>
            <span className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded border ${current.badgeColor}`}>
              {current.badge}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(current.step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card Content */}
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700">
              <StepIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{current.title}</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{current.description}</p>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIndex === STEPS.length - 1}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition disabled:opacity-40"
            >
              Next Step
            </button>
          </div>

          <button
            onClick={handleExecuteAction}
            className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
