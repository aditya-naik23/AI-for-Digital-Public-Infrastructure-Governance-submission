import React, { useState } from 'react';
import { DevelopmentProject } from '../../types';

interface ProjectTrackerProps {
  projects: DevelopmentProject[];
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({ projects }) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Capital Projects & Impact Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Closing the governance loop: tracking infrastructure delivery and measured complaint reduction.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
          {['All', 'Under Construction', 'Commissioned', 'Tendering'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((proj) => (
          <div key={proj.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700">{proj.code}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                    {proj.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{proj.title}</h3>
                <div className="text-xs text-slate-500">
                  Lead Agency: {proj.leadMinistry} • District: {proj.district}
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="text-slate-500 block">Budget:</span>
                <span className="font-bold text-slate-900 text-sm">
                  ${(proj.budgetAllocatedUsd / 1000000).toFixed(2)}M USD
                </span>
              </div>
            </div>

            {/* Before vs After Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Baseline */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-800 block">1. Baseline Before Project</span>
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Complaints:</span>
                  <strong>{proj.impactBaseline.monthlyCitizenComplaints} reports/mo</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Access Deficit:</span>
                  <span className="truncate max-w-[200px]">{proj.impactBaseline.accessDeficitMetric}</span>
                </div>
              </div>

              {/* Measured Impact */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-800 block">2. Post-Commissioning Outcome</span>
                {proj.impactPostCommissioning ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Verified Complaint Reduction:</span>
                      <strong className="text-emerald-700">
                        -{proj.impactPostCommissioning.verifiedReductionPercentage}% ({proj.impactPostCommissioning.postMonthlyComplaints} reports/mo)
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Citizen Satisfaction:</span>
                      <strong className="text-emerald-700">{proj.impactPostCommissioning.citizenSatisfactionRate}%</strong>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 italic pt-1">
                    Project under construction. Post-handover citizen feedback active on completion.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
