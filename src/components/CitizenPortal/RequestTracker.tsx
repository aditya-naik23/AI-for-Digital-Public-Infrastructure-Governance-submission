import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck, MapPin, Calendar, FileText } from 'lucide-react';
import { CitizenRequest } from '../../types';

interface RequestTrackerProps {
  allRequests: CitizenRequest[];
}

export const RequestTracker: React.FC<RequestTrackerProps> = ({ allRequests }) => {
  const [searchId, setSearchId] = useState('BRICS-DPI-2026-9041');
  const [searchedRequest, setSearchedRequest] = useState<CitizenRequest | null>(() => {
    return allRequests.find((r) => r.id === 'BRICS-DPI-2026-9041') || allRequests[0] || null;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = searchId.trim().toUpperCase();
    const found = allRequests.find((r) => r.id.toUpperCase() === clean);
    if (found) {
      setSearchedRequest(found);
    } else {
      setSearchedRequest(null);
      setErrorMsg(`No record found for ID "${searchId}". Please verify your receipt.`);
    }
  };

  const getStepStatus = (stepIndex: number, currentStatus: CitizenRequest['status']) => {
    const statusMap: Record<CitizenRequest['status'], number> = {
      submitted: 0,
      ai_analyzed: 1,
      under_review: 2,
      verified: 2,
      project_approved: 3,
      in_progress: 3,
      resolved: 4,
      rejected: 2,
    };
    const currentStep = statusMap[currentStatus] ?? 1;
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Track Your Request</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your Request ID to check official verification status. Personal data and internal scoring are sequestered.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="E.g., BRICS-DPI-2026-9041"
              className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition shadow-xs"
          >
            Track Status
          </button>
        </form>

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Detailed Status Result */}
        {searchedRequest && (
          <div className="pt-4 border-t border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-sm font-bold text-slate-900">{searchedRequest.id}</span>
                <div className="text-xs text-slate-600 mt-0.5">
                  Category: <strong>{searchedRequest.reportedCategory}</strong>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="inline-block px-2 py-0.5 rounded font-medium text-[11px] bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {searchedRequest.status.replace('_', ' ')}
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(searchedRequest.submissionDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Public Milestones */}
            <div className="space-y-4 text-xs">
              <div className="font-semibold text-slate-800 text-xs">Verification Milestones</div>

              <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                {/* 1. Ingested */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>1. Request Ingested & Hashed</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cryptographic SHA-256 fingerprint anchored to municipal ledger.
                  </p>
                </div>

                {/* 2. AI Pre-screening */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        getStepStatus(1, searchedRequest.status) === 'completed'
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span>2. Multilingual & Evidence Pre-screening</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Language normalized ({searchedRequest.originalLanguage}). Geolocation consistency verified.
                  </p>
                </div>

                {/* 3. Official Review */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        searchedRequest.isVerifiedByHuman
                          ? 'bg-emerald-600'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span>3. Official Authority Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {searchedRequest.isVerifiedByHuman
                      ? `Verified by authorized planning officer (${searchedRequest.verifiedBy?.split(' ')[0]})`
                      : 'In authority queue for inspection and validation.'}
                  </p>
                </div>

                {/* 4. Capital Works Integration */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        searchedRequest.status === 'project_approved' || searchedRequest.status === 'in_progress'
                          ? 'bg-blue-600'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span>4. Capital Works Integration</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Demand mapped to regional development plans and infrastructure gap budget allocations.
                  </p>
                </div>
              </div>
            </div>

            {/* Preserved Submission */}
            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                Your Registered Text:
              </span>
              <p className="text-slate-700 italic">"{searchedRequest.originalText}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
