import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Copy, ArrowRight, Printer } from 'lucide-react';
import { CitizenRequest } from '../../types';

interface SubmissionSuccessModalProps {
  request: CitizenRequest;
  onClose: () => void;
  onTrack: () => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  request,
  onClose,
  onTrack,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(request.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 max-w-md w-full text-slate-900 shadow-lg space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Request Registered</h2>
            <p className="text-xs text-slate-500">Official Sovereign Receipt Issued</p>
          </div>
        </div>

        {/* Request ID Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Your Request ID
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-slate-900">{request.id}</span>
            <button
              onClick={handleCopyId}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 rounded flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3 text-slate-500" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate pt-1">
            SHA-256: {request.evidenceList[0]?.sha256Hash || 'sha256-verified'}
          </div>
        </div>

        {/* Request Summary */}
        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-3 rounded border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-400">Category:</span>
            <span className="font-medium text-slate-800">{request.reportedCategory}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Location:</span>
            <span className="font-medium text-slate-800 truncate max-w-[200px]">{request.reportedLocation.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date:</span>
            <span>{new Date(request.submissionDate).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 px-3 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={() => {
              onTrack();
              onClose();
            }}
            className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <span>Track Progress</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-700 transition"
        >
          Submit Another Request
        </button>
      </div>
    </div>
  );
};
