import React, { useState } from 'react';
import { Sliders, Users, Database, FileText, Activity, Save, CheckCircle2 } from 'lucide-react';
import { PriorityWeights, UserProfile, AuditLogEntry, Role } from '../../types';

interface AdminConsoleProps {
  weights: PriorityWeights;
  onUpdateWeights: (newWeights: PriorityWeights) => void;
  users: UserProfile[];
  onUpdateUserRole: (userId: string, newRole: Role) => void;
  auditLogs: AuditLogEntry[];
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  weights,
  onUpdateWeights,
  users,
  onUpdateUserRole,
  auditLogs,
}) => {
  const [adminTab, setAdminTab] = useState<'weights' | 'rbac' | 'datasets' | 'audit' | 'monitoring'>('weights');
  const [localWeights, setLocalWeights] = useState<PriorityWeights>({ ...weights });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const weightSum = Number(
    (
      localWeights.citizenDemandWeight +
      localWeights.infrastructureGapWeight +
      localWeights.populationImpactWeight +
      localWeights.severityWeight +
      localWeights.planAlignmentWeight
    ).toFixed(2)
  );

  const handleWeightChange = (key: keyof PriorityWeights, val: number) => {
    setLocalWeights((prev) => ({ ...prev, [key]: val }));
    setSaveSuccess(false);
  };

  const handleNormalize = () => {
    const sum =
      localWeights.citizenDemandWeight +
      localWeights.infrastructureGapWeight +
      localWeights.populationImpactWeight +
      localWeights.severityWeight +
      localWeights.planAlignmentWeight;
    if (sum === 0) return;
    setLocalWeights({
      citizenDemandWeight: Number((localWeights.citizenDemandWeight / sum).toFixed(2)),
      infrastructureGapWeight: Number((localWeights.infrastructureGapWeight / sum).toFixed(2)),
      populationImpactWeight: Number((localWeights.populationImpactWeight / sum).toFixed(2)),
      severityWeight: Number((localWeights.severityWeight / sum).toFixed(2)),
      planAlignmentWeight: Number((localWeights.planAlignmentWeight / sum).toFixed(2)),
    });
  };

  const handleSave = () => {
    onUpdateWeights(localWeights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="w-full space-y-6">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sovereign Governance & Administration Console</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control, algorithmic priority weights, and cryptographic audit ledgers.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setAdminTab('weights')}
            className={`px-3 py-1.5 rounded transition ${
              adminTab === 'weights'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Priority Weights
          </button>
          <button
            onClick={() => setAdminTab('rbac')}
            className={`px-3 py-1.5 rounded transition ${
              adminTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setAdminTab('datasets')}
            className={`px-3 py-1.5 rounded transition ${
              adminTab === 'datasets'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Datasets
          </button>
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3 py-1.5 rounded transition ${
              adminTab === 'audit'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setAdminTab('monitoring')}
            className={`px-3 py-1.5 rounded transition ${
              adminTab === 'monitoring'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Model Health
          </button>
        </div>
      </div>

      {/* Tab: Weights */}
      {adminTab === 'weights' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority Engine Weight Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust governance weights. Changes recalculate priority indicators across all regional clusters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                Sum: {weightSum.toFixed(2)} / 1.00
              </span>

              {weightSum !== 1.0 && (
                <button
                  onClick={handleNormalize}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs transition"
                >
                  Auto-Normalize
                </button>
              )}

              <button
                onClick={handleSave}
                className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Weights</span>
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Weights updated and recorded in the audit log.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Citizen Demand Weight</span>
                <span>{(localWeights.citizenDemandWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={localWeights.citizenDemandWeight}
                onChange={(e) => handleWeightChange('citizenDemandWeight', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Weight for frequency of citizen complaints in area.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Infrastructure Gap Deficit</span>
                <span>{(localWeights.infrastructureGapWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={localWeights.infrastructureGapWeight}
                onChange={(e) => handleWeightChange('infrastructureGapWeight', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Weight for physical absence of facilities vs statutory norms.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Population Impact</span>
                <span>{(localWeights.populationImpactWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={localWeights.populationImpactWeight}
                onChange={(e) => handleWeightChange('populationImpactWeight', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Weight for demographic count affected.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Severity & Life Safety</span>
                <span>{(localWeights.severityWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={localWeights.severityWeight}
                onChange={(e) => handleWeightChange('severityWeight', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Weight for structural hazard and disease risk.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: RBAC */}
      {adminTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">User Role Management (RBAC)</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-500">{u.department}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono uppercase text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateUserRole(u.id, e.target.value as Role)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="verifier">Verifier</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Datasets */}
      {adminTab === 'datasets' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Demographic & Infrastructure Datasets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1">
              <strong className="text-slate-900 block">Census 2026 Registry</strong>
              <div className="text-slate-600">4.2M Geocoded Records</div>
              <div className="text-[11px] text-slate-400">Synchronized daily from official nodes</div>
            </div>
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1">
              <strong className="text-slate-900 block">Public Facility PostGIS Mesh</strong>
              <div className="text-slate-600">18,400 Government Assets</div>
              <div className="text-[11px] text-slate-400">Hospitals, bridges, clinics, water tanks</div>
            </div>
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1">
              <strong className="text-slate-900 block">5-Year Capital Budget Master</strong>
              <div className="text-slate-600">USD $4.8B Allocation Tranches</div>
              <div className="text-[11px] text-slate-400">BRICS Regional Infrastructure Fund</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit Log */}
      {adminTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Cryptographic Audit Ledger</h3>
            <span className="text-[11px] font-mono text-slate-500">SHA-256 Hash Chained</span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{log.actor}</td>
                  <td className="py-2.5 px-4 text-blue-700 font-bold">{log.action}</td>
                  <td className="py-2.5 px-4 font-sans text-xs text-slate-600 max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Model Monitoring */}
      {adminTab === 'monitoring' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Model & Anti-Spam Telemetry
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">Deduplication Ratio</span>
              <strong className="text-lg text-slate-900">84.2%</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">CV Object F1 Score</span>
              <strong className="text-lg text-slate-900">93.8%</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">Translation Accuracy</span>
              <strong className="text-lg text-slate-900">95.4%</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">Astroturf Anomaly</span>
              <strong className="text-lg text-emerald-700">0 Flags</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
