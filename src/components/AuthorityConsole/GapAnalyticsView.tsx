import React from 'react';
import { AlertOctagon, Users, Building2, PlusCircle } from 'lucide-react';
import { InfrastructureGap } from '../../types';

interface GapAnalyticsViewProps {
  gaps: InfrastructureGap[];
  onCreateProjectFromGap: (gap: InfrastructureGap) => void;
}

export const GapAnalyticsView: React.FC<GapAnalyticsViewProps> = ({
  gaps,
  onCreateProjectFromGap,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Infrastructure Gap Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-referencing citizen demand with official census demographic data and existing facility asset inventories.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs bg-slate-50 px-3.5 py-2 rounded border border-slate-200">
          <div>
            <div className="text-slate-500">Documented Gaps</div>
            <div className="text-base font-bold text-slate-900">{gaps.length} Areas</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-slate-500">Average Deficit Index</div>
            <div className="text-base font-bold text-red-700">87.9 / 100</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap) => (
          <div
            key={gap.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{gap.category} Deficit</h3>
                  <div className="text-xs text-slate-500">{gap.district} ({gap.region})</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Gap Index</div>
                  <div className="text-lg font-bold text-red-700">{gap.gapIndex.toFixed(1)}/100</div>
                </div>
              </div>

              {/* Data points */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Census Population</span>
                  <strong className="text-slate-900">{gap.population.toLocaleString()} citizens</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Existing Facilities</span>
                  <strong className="text-slate-900">{gap.existingFacilitiesCount} within radius</strong>
                </div>
              </div>

              {/* Deficit detail */}
              <div className="text-xs space-y-1 text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Deficit & Norm Comparison:</div>
                <div className="text-slate-600">{gap.currentDeficit}</div>
                <div className="text-[11px] text-slate-500 pt-1">Standard: {gap.recommendedNormRatio}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Estimated Capital Cost:</span>
                <span className="font-semibold text-slate-900">
                  ${(gap.estimatedCapitalCostUsd / 1000000).toFixed(2)}M USD
                </span>
              </div>
              <button
                onClick={() => onCreateProjectFromGap(gap)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
