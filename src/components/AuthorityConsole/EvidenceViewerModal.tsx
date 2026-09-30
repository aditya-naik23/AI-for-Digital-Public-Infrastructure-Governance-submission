import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Eye,
  FileCheck,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { CitizenRequest, InfrastructureCategory, SeverityLevel } from '../../types';

interface EvidenceViewerModalProps {
  request: CitizenRequest;
  onClose: () => void;
  onVerifyAndApprove: (
    requestId: string,
    adjustedCategory?: InfrastructureCategory,
    adjustedSeverity?: SeverityLevel,
    notes?: string
  ) => void;
  currentUserRole: string;
  currentUserName: string;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  request,
  onClose,
  onVerifyAndApprove,
  currentUserName,
}) => {
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState(request.verificationNotes || '');
  const [targetCategory, setTargetCategory] = useState<InfrastructureCategory>(
    request.structuredExtraction?.category || request.reportedCategory
  );
  const [targetSeverity, setTargetSeverity] = useState<SeverityLevel>(
    request.structuredExtraction?.severity || 'High'
  );
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const currentEvidence = request.evidenceList[selectedEvidenceIndex] || request.evidenceList[0];

  const handleAction = (statusMessage: string) => {
    onVerifyAndApprove(
      request.id,
      isOverrideOpen ? targetCategory : undefined,
      isOverrideOpen ? targetSeverity : undefined,
      verificationNotes || statusMessage
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full text-slate-900 shadow-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{request.id}</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${
                  request.priorityScore.indicatorLevel === 'Urgent'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {request.priorityScore.indicatorLevel} Priority ({request.priorityScore.overallScore}/100)
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {request.reportedLocation.name} • {request.reportedCategory}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-Column Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COLUMN: Citizen Submission */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
                Citizen Submission
              </h3>

              {/* Original & Translated Text */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Original Input ({request.originalLanguage}):
                  </span>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 italic mt-0.5">
                    "{request.originalText}"
                  </div>
                </div>

                {request.structuredExtraction?.canonicalEnglishTranslation && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Standard English Translation:
                    </span>
                    <div className="p-3 bg-blue-50/50 rounded border border-blue-100 text-slate-800 mt-0.5 leading-relaxed">
                      {request.structuredExtraction.canonicalEnglishTranslation}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Evidence with Bounding Boxes */}
              {currentEvidence && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Visual Evidence & CV Detection:
                  </span>
                  <div className="relative rounded border border-slate-200 bg-slate-100 aspect-video overflow-hidden">
                    <img
                      src={currentEvidence.url}
                      alt={currentEvidence.fileName}
                      className="w-full h-full object-cover"
                    />

                    {/* CV Bounding Boxes */}
                    {currentEvidence.cvDetections?.map((det, idx) => {
                      const [ymin, xmin, ymax, xmax] = det.box;
                      return (
                        <div
                          key={idx}
                          className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                          style={{
                            top: `${ymin}%`,
                            left: `${xmin}%`,
                            width: `${xmax - xmin}%`,
                            height: `${ymax - ymin}%`,
                          }}
                        >
                          <div className="absolute top-0 left-0 -translate-y-full bg-slate-900 text-white px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap">
                            {det.label} ({det.confidence}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Evidence Confidence: <strong>{currentEvidence.overallAuthenticityScore}%</strong></span>
                    <span>GPS Alignment: <strong>{currentEvidence.locationMatchConfidence}%</strong></span>
                  </div>
                </div>
              )}

              {/* Location & Time */}
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{request.reportedLocation.name} ({request.reportedLocation.district})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted: {new Date(request.submissionDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Analysis */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
                AI Structured Analysis
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Category</span>
                  <strong className="text-slate-900">{request.structuredExtraction.category}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Severity</span>
                  <strong className="text-red-700">{request.structuredExtraction.severity}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">AI Confidence</span>
                  <strong className="text-slate-900">{request.structuredExtraction.aiConfidenceScore}%</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Related Requests</span>
                  <strong className="text-slate-900">{request.clusterCount} in cluster</strong>
                </div>
              </div>

              {/* Infrastructure Context */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Infrastructure Context
                </h4>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Demographic Reach:</span>
                    <span>~{request.structuredExtraction.mentionedPopulationAffected.toLocaleString()} citizens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nearest Government Asset:</span>
                    <span>Primary Health Post (6 beds, 54km distance)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Statutory Norm:</span>
                    <span>1 facility per 30,000 population</span>
                  </div>
                </div>
              </div>

              {/* Why Flagged Explanation */}
              <div className="space-y-1 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Why This Request Was Flagged
                </h4>
                <p className="text-xs text-slate-700 bg-amber-50/60 border border-amber-200 p-2.5 rounded leading-relaxed">
                  High citizen demand ({request.clusterCount} reports) combined with acute healthcare deficit and
                  distance barrier (54km over mountain pass to secondary care).
                </p>
              </div>

              {/* Override Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsOverrideOpen(!isOverrideOpen)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isOverrideOpen ? 'Hide Manual Override' : 'Modify Category / Severity'}
                </button>

                {isOverrideOpen && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded p-1 text-xs"
                    >
                      <option value="Healthcare">Healthcare</option>
                      <option value="Roads & Bridges">Roads & Bridges</option>
                      <option value="Clean Water & Sanitation">Clean Water</option>
                      <option value="Flood & Storm Drainage">Flood & Drainage</option>
                    </select>

                    <select
                      value={targetSeverity}
                      onChange={(e) => setTargetSeverity(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded p-1 text-xs"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Official Verification Notes Input */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Authority Review Notes:
            </label>
            <input
              type="text"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="E.g., Field inspection validates lack of hospital facility. Escalating for DPR..."
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Authority Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200">
            <button
              onClick={() => handleAction('Request rejected by authority')}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction('Additional field review requested')}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              Request Field Review
            </button>
            <button
              onClick={() => handleAction('Officially verified and endorsed')}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
            >
              Verify & Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
