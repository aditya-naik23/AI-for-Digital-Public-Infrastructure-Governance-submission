import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { CitizenRequest } from '../../types';

interface RequestsTableProps {
  requests: CitizenRequest[];
  onInspectRequest: (request: CitizenRequest) => void;
  onQuickVerify: (requestId: string) => void;
}

export const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  onInspectRequest,
  onQuickVerify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (categoryFilter !== 'All' && r.reportedCategory !== categoryFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.reportedLocation.name.toLowerCase().includes(q) &&
          !r.reportedCategory.toLowerCase().includes(q) &&
          !r.originalText.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, categoryFilter, statusFilter, searchTerm]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
      {/* Table Toolbar */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, keyword, or village name..."
            className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 text-xs font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Roads & Bridges">Roads & Bridges</option>
            <option value="Clean Water & Sanitation">Clean Water</option>
            <option value="Flood & Storm Drainage">Flood & Drainage</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 text-xs font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="ai_analyzed">Pending Verification</option>
            <option value="project_approved">Project Sanctioned</option>
          </select>
        </div>
      </div>

      {/* Clean Editorial Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 font-mono">
            <tr>
              <th className="py-2.5 px-4">Request Dossier</th>
              <th className="py-2.5 px-4">Category & Location</th>
              <th className="py-2.5 px-4">Citizen Description (Original / Translation)</th>
              <th className="py-2.5 px-4">Authenticity & CV</th>
              <th className="py-2.5 px-4">Priority Score</th>
              <th className="py-2.5 px-4">Verification</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((req) => {
              const isUrgent = req.priorityScore.indicatorLevel === 'Urgent';
              const authScore = req.evidenceList[0]?.overallAuthenticityScore || 96.8;

              return (
                <tr key={req.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-slate-900 block text-xs">{req.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.submissionDate).toLocaleDateString()} • {req.clusterCount} clustered
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{req.reportedCategory}</div>
                    <div className="text-[11px] text-slate-500">{req.reportedLocation.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {req.reportedLocation.district}
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <div className="text-slate-800 text-[11px] leading-relaxed line-clamp-2">
                      "{req.structuredExtraction.canonicalEnglishTranslation || req.originalText}"
                    </div>
                    {req.originalLanguage && req.originalLanguage !== 'English (Canonical Standard)' && (
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        Native: {req.originalLanguage}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{authScore}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                      {req.evidenceList[0]?.sha256Hash?.substring(0, 14)}...
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isUrgent
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {req.priorityScore.overallScore}/100 {req.priorityScore.indicatorLevel}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        req.isVerifiedByHuman
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {req.isVerifiedByHuman ? `Verified (${req.verifiedBy?.split(' ')[0]})` : 'Pending Sign-off'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onInspectRequest(req)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-medium transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-slate-500" />
                      <span>Inspect</span>
                    </button>

                    {!req.isVerifiedByHuman && (
                      <button
                        onClick={() => onQuickVerify(req.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verify</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
