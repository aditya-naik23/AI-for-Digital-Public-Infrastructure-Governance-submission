import React, { useState } from 'react';
import { X, BookOpen, Layers, Cpu, ShieldCheck, Code2, Database } from 'lucide-react';

interface SystemArchitectureModalProps {
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({ onClose }) => {
  const [activeSpecTab, setActiveSpecTab] = useState<'ml' | 'arch' | 'dpg' | 'api'>('ml');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full text-slate-900 shadow-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Technical Specifications & DPG Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation Reference • Track 1: AI for Digital Public Infrastructure
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 text-xs">
          <button
            onClick={() => setActiveSpecTab('ml')}
            className={`py-3 px-3 font-semibold border-b-2 transition ${
              activeSpecTab === 'ml'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            7-Part AI/ML Pipeline
          </button>
          <button
            onClick={() => setActiveSpecTab('arch')}
            className={`py-3 px-3 font-semibold border-b-2 transition ${
              activeSpecTab === 'arch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            PostGIS Data Model
          </button>
          <button
            onClick={() => setActiveSpecTab('dpg')}
            className={`py-3 px-3 font-semibold border-b-2 transition ${
              activeSpecTab === 'dpg'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Digital Public Good (DPG)
          </button>
          <button
            onClick={() => setActiveSpecTab('api')}
            className={`py-3 px-3 font-semibold border-b-2 transition ${
              activeSpecTab === 'api'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            REST API Endpoints
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          {activeSpecTab === 'ml' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 text-xs block mb-1">
                  Why Multiple Modular AI Engines Instead of a Single Model?
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Government planning requires explainability, verifiability, and auditability. InfraPulse splits tasks
                  into 7 focused components:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">1. Multilingual Speech & NLP</strong>
                  <p className="text-slate-600 text-[11px]">
                    Whisper STT + language identification for Hindi, Odia, Portuguese, Mandarin, Russian. Preserves
                    original citizen text.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">2. Sentence Transformers</strong>
                  <p className="text-slate-600 text-[11px]">
                    Semantic cosine embeddings across submissions in a 2km radius / 14-day window to deduplicate demand.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">3. Computer Vision Evidence</strong>
                  <p className="text-slate-600 text-[11px]">
                    YOLO/OpenCV detects potholes, flooding, and overcrowding. Calculates cryptographic SHA-256 and EXIF GPS match.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">4. Spatial Density Clustering</strong>
                  <p className="text-slate-600 text-[11px]">
                    PostGIS spatial clustering identifies geographic hotspots without inflating spam complaints.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">5. Demographic Gap Cross-Referencing</strong>
                  <p className="text-slate-600 text-[11px]">
                    Compares demand against Census 2026 data and existing facility locations to evaluate statutory deficits.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">6. Transparent Priority Engine</strong>
                  <p className="text-slate-600 text-[11px]">
                    Transparent formula with configurable weights. Displays full justification waterfall. Never makes automated spending decisions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSpecTab === 'arch' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-900 text-xs block mb-1">PostgreSQL + PostGIS Schema</span>
                <p className="text-slate-600 mb-2">Spatial schema with GIST index for geographic deduplication:</p>
                <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-200 overflow-x-auto space-y-0.5">
                  <div>CREATE TABLE citizen_requests (</div>
                  <div className="pl-4">id VARCHAR(32) PRIMARY KEY,</div>
                  <div className="pl-4">geom GEOMETRY(Point, 4326),</div>
                  <div className="pl-4">reported_category VARCHAR(64),</div>
                  <div className="pl-4">original_text TEXT,</div>
                  <div className="pl-4">canonical_translation TEXT,</div>
                  <div className="pl-4">evidence_sha256 VARCHAR(64),</div>
                  <div className="pl-4">priority_score NUMERIC(5,2),</div>
                  <div className="pl-4">is_verified_by_human BOOLEAN DEFAULT FALSE</div>
                  <div>);</div>
                  <div className="mt-1">CREATE INDEX idx_requests_geom ON citizen_requests USING GIST (geom);</div>
                </div>
              </div>
            </div>
          )}

          {activeSpecTab === 'dpg' && (
            <div className="space-y-2.5">
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                <strong className="text-slate-900 block">Digital Public Good (DPG) Standards</strong>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>• <strong>Sovereign & Open:</strong> Interoperable architecture deployable on sovereign national or municipal clouds.</li>
                  <li>• <strong>Privacy by Design:</strong> Citizen identities are sequestered. Citizens only track their own request ID.</li>
                  <li>• <strong>Human-in-the-Loop:</strong> Strict principle that AI provides decision support, not automatic spending or policy enactments.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSpecTab === 'api' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-blue-700">POST /api/v1/requests</span>
                <div className="text-slate-500 font-sans text-xs">Citizen submission ingestion (text, voice, photo, GPS)</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-blue-700">GET /api/v1/requests/{'{id}'}/status</span>
                <div className="text-slate-500 font-sans text-xs">Public tracking without exposing internal scoring weights</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-900">POST /api/v1/authority/verify/{'{id}'}</span>
                <div className="text-slate-500 font-sans text-xs">Official human sign-off recorded in immutable audit log</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
