import React, { useState } from 'react';
import { Sliders, Info, CheckCircle2 } from 'lucide-react';
import { CitizenRequest, PriorityWeights } from '../../types';

interface PriorityEngineViewProps {
  requests: CitizenRequest[];
  weights: PriorityWeights;
  onVerifyRequest: (requestId: string, notes: string) => void;
}

export const PriorityEngineView: React.FC<PriorityEngineViewProps> = ({
  requests,
  weights,
  onVerifyRequest,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState(
    requests[0]?.id || 'BRICS-DPI-2026-9041'
  );
  const [officerNotes, setOfficerNotes] = useState('');
  const [endorsedSuccess, setEndorsedSuccess] = useState(false);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || requests[0];
  const priority = selectedRequest?.priorityScore;

  if (!selectedRequest || !priority) {
    return <div className="p-6 text-center text-slate-500">No requests available for evaluation.</div>;
  }

  const { breakdown } = priority;

  const factors = [
    {
      name: 'Citizen Demand Intensity',
      score: breakdown.citizenDemandScore,
      weight: weights.citizenDemandWeight,
      weightedValue: (breakdown.citizenDemandScore * weights.citizenDemandWeight).toFixed(1),
      description: `${selectedRequest.clusterCount} deduplicated citizen reports`,
    },
    {
      name: 'Infrastructure Deficit Gap',
      score: breakdown.infrastructureGapScore,
      weight: weights.infrastructureGapWeight,
      weightedValue: (breakdown.infrastructureGapScore * weights.infrastructureGapWeight).toFixed(1),
      description: 'Calculated deficit vs official equity standard ratio',
    },
    {
      name: 'Demographic Population Reach',
      score: breakdown.populationImpactScore,
      weight: weights.populationImpactWeight,
      weightedValue: (breakdown.populationImpactScore * weights.populationImpactWeight).toFixed(1),
      description: `Impacts ~${selectedRequest.structuredExtraction.mentionedPopulationAffected.toLocaleString()} citizens`,
    },
    {
      name: 'Hazard & Physical Severity',
      score: breakdown.severityScore,
      weight: weights.severityWeight,
      weightedValue: (breakdown.severityScore * weights.severityWeight).toFixed(1),
      description: `Classified as ${selectedRequest.structuredExtraction.severity} risk`,
    },
    {
      name: '5-Year Plan Alignment',
      score: breakdown.planAlignmentScore,
      weight: weights.planAlignmentWeight,
      weightedValue: (breakdown.planAlignmentScore * weights.planAlignmentWeight).toFixed(1),
      description: 'Alignment with municipal capital works plan',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Explainable Priority Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, auditable algorithmic decision support. AI provides indicators; authorized officials make decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Select Case:</span>
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.reportedCategory} ({r.reportedLocation.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Factor Breakdown */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Priority Evaluation</span>
              <h3 className="text-base font-bold text-slate-900">
                {selectedRequest.reportedLocation.name} ({selectedRequest.reportedCategory})
              </h3>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                  priority.indicatorLevel === 'Urgent'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {priority.indicatorLevel} Priority
              </span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {priority.overallScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
              Weighted Factor Contribution:
            </div>

            {factors.map((f, i) => (
              <div key={i} className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">{f.name}</span>
                  <span className="font-mono text-slate-600">
                    {f.score} × {(f.weight * 100).toFixed(0)}% ={' '}
                    <strong className="text-slate-900">+{f.weightedValue} pts</strong>
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${f.score}%` }} />
                </div>

                <div className="text-[11px] text-slate-500">{f.description}</div>
              </div>
            ))}
          </div>

          {/* Formula explanation */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Calculated Governance Formula:</span>
            </div>
            <p className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
              {priority.weightedFormulaExplanation}
            </p>
          </div>
        </div>

        {/* Right Column: Why Flagged & Endorsement */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Why This Area Received This Indicator
            </h4>
            <div className="space-y-2 text-xs">
              {priority.keyDrivers.map((driver, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Official Endorsement
            </h4>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="Enter official justification..."
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {endorsedSuccess ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recommendation endorsed & logged to sovereign audit ledger.</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  onVerifyRequest(selectedRequest.id, officerNotes || 'Officially endorsed by planning officer.');
                  setEndorsedSuccess(true);
                  setTimeout(() => setEndorsedSuccess(false), 3000);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Endorse Recommendation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
