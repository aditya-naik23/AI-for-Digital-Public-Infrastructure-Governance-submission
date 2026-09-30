import React, { useState, useRef } from 'react';
import { Mic, MicOff, Camera, MapPin, Send, CheckCircle2, ArrowRight, Search, Copy } from 'lucide-react';
import { CitizenRequest, InfrastructureCategory } from '../../types';

interface CitizenPortalProps {
  allRequests: CitizenRequest[];
  onSubmitRequest: (data: {
    text: string;
    category: InfrastructureCategory;
    location: {
      name: string;
      lat: number;
      lng: number;
      district: string;
      region: string;
    };
    files: File[];
    audioBlobUrl?: string;
    audioTranscript?: string;
  }) => void;
  isSubmitting: boolean;
  latestSubmittedRequest: CitizenRequest | null;
  onClearLatestSubmitted: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  allRequests,
  onSubmitRequest,
  isSubmitting,
  latestSubmittedRequest,
  onClearLatestSubmitted,
}) => {
  const [mode, setMode] = useState<'submit' | 'track'>('submit');
  const [text, setText] = useState('');
  const [locationName, setLocationName] = useState('Kashipur Village Cluster, Rayagada');
  const [coordinates, setCoordinates] = useState({ lat: 19.364, lng: 83.141 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tracking state
  const [trackId, setTrackId] = useState('BRICS-DPI-2026-9041');
  const [trackedRequest, setTrackedRequest] = useState<CitizenRequest | null>(() => {
    return allRequests[0] || null;
  });
  const [trackError, setTrackError] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick preset helper
  const handleSetSample = () => {
    setText(
      'Our village has 20,000 people and there is no government hospital nearby. Pregnant mothers must travel 50km over the mountain pass to Koraput. We urgently need a health facility.'
    );
    setLocationName('Kashipur Village Cluster, Rayagada');
    setCoordinates({ lat: 19.364, lng: 83.141 });
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => {
        setRecSeconds((s) => {
          if (s >= 3) {
            clearInterval(timerRef.current);
            setIsRecording(false);
            setRecordedAudio('voice-note-recorded.webm');
            if (!text.trim()) {
              setText(
                'हमारे काशीपुर गांव में 20,000 लोग रहते हैं और यहां कोई सरकारी अस्पताल नहीं है। गर्भवती महिलाओं को 50 किलोमीटर दूर जाना पड़ता है।'
              );
            }
            return 3;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordedAudio('voice-note-recorded.webm');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !recordedAudio) {
      alert('Please describe your development need or record a voice note.');
      return;
    }

    onSubmitRequest({
      text: text.trim() || 'Voice submission recorded by citizen.',
      category: 'Healthcare', // Inferred by AI pipeline
      location: {
        name: locationName,
        lat: coordinates.lat,
        lng: coordinates.lng,
        district: 'Rayagada',
        region: 'Odisha, India',
      },
      files: selectedFiles,
      audioBlobUrl: recordedAudio || undefined,
      audioTranscript: text.trim() || undefined,
    });
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    const clean = trackId.trim().toUpperCase();
    const found = allRequests.find((r) => r.id.toUpperCase() === clean);
    if (found) {
      setTrackedRequest(found);
    } else {
      setTrackedRequest(null);
      setTrackError(`No record found for ID "${trackId}".`);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12 space-y-6">
      {/* Top Mode Segmented Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Sovereign Digital Public Infrastructure
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Citizen Demand Portal
          </h1>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('submit');
              onClearLatestSubmitted();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'submit'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submit Need
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('track');
              onClearLatestSubmitted();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'track'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Status
          </button>
        </div>
      </div>

      {mode === 'submit' ? (
        latestSubmittedRequest ? (
          /* Clean Submission Receipt */
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Submission Registered</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your report has been hashed with SHA-256 and queued for automated multimodal classification and official municipal review.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Official Tracking Token</div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-slate-900 tracking-tight">{latestSubmittedRequest.id}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(latestSubmittedRequest.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-md shadow-2xs flex items-center gap-1.5 transition font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
              <div className="text-xs text-slate-600 pt-3 border-t border-slate-200/80 flex flex-wrap justify-between gap-2">
                <span>Location: <strong>{latestSubmittedRequest.reportedLocation.name}</strong></span>
                <span className="capitalize">Status: <strong className="text-emerald-700 font-semibold">{latestSubmittedRequest.status.replace('_', ' ')}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTrackId(latestSubmittedRequest.id);
                  setTrackedRequest(latestSubmittedRequest);
                  setMode('track');
                  onClearLatestSubmitted();
                }}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
              >
                <span>Track Live Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setSelectedFiles([]);
                  setRecordedAudio(null);
                  onClearLatestSubmitted();
                }}
                className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition"
              >
                Submit Another Need
              </button>
            </div>
          </div>
        ) : (
          /* Public-Service Submission Form */
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Report Infrastructure Deficit</h2>
                <button
                  type="button"
                  onClick={handleSetSample}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Load Kashipur Example
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your community requirement in any language, voice note, or upload photo evidence.
              </p>
            </div>

            {/* Describe problem */}
            <div className="space-y-1.5">
              <label htmlFor="problem-desc" className="text-xs font-semibold text-slate-700 block">
                Problem Description (Any Language)
              </label>
              <textarea
                id="problem-desc"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe what your village or neighborhood lacks (e.g., hospital needed, bridge collapsed, contaminated drinking water, school too far away)..."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>

            {/* Row of multimodal inputs: Voice, Photo, Location */}
            <div className="space-y-3 pt-1">
              {/* Voice button */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {isRecording
                        ? `Recording Voice Note (${recSeconds}s)...`
                        : recordedAudio
                        ? 'Multilingual Voice Note Recorded'
                        : 'Voice Note (Multilingual Speech-to-Text)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Whisper transcription preserves original dialect and detects language
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    isRecording
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  {isRecording ? 'Stop' : recordedAudio ? 'Re-record' : 'Record'}
                </button>
              </div>

              {/* Photo button */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} photo evidence attached`
                        : 'Field Photos & Video Evidence'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Analyzed with YOLO computer vision for structural defect detection
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium transition shadow-2xs"
                >
                  {selectedFiles.length > 0 ? 'Change' : 'Select Files'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                  }}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Location input */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Village / Town / Landmark coordinates"
                  className="w-full bg-transparent text-slate-900 focus:outline-none text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setLocationName('Current Geolocation Pin (Lat: ' + pos.coords.latitude.toFixed(3) + ')');
                      });
                    }
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-blue-600 hover:text-blue-700 font-medium shrink-0 text-[11px] shadow-2xs"
                >
                  GPS Coordinates
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <span>Processing Multimodal Ingestion...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Public Infrastructure Ledger</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )
      ) : (
        /* Request Status Lookup with Lifecycle Pipeline */
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Track Citizen Request</h2>
            <p className="text-xs text-slate-500 mt-1">Look up verified status and governance decisions using your request ID.</p>
          </div>

          <form onSubmit={handleTrackSearch} className="flex gap-2">
            <input
              type="text"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="e.g. BRICS-DPI-2026-9041"
              className="flex-1 h-10 px-3.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
            <button
              type="submit"
              className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              Verify Token
            </button>
          </form>

          {trackError && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{trackError}</div>}

          {trackedRequest && (
            <div className="pt-4 border-t border-slate-100 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="font-mono text-base font-bold text-slate-900">{trackedRequest.id}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Logged on {new Date(trackedRequest.submissionDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className={`inline-block capitalize px-2.5 py-1 rounded-md border text-xs font-semibold ${
                    trackedRequest.isVerifiedByHuman
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {trackedRequest.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* 5-Stage Visual Lifecycle Progress */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Decision Pipeline Lifecycle</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    1. Ingested & Hashed ✓
                  </div>
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    2. Multimodal AI ✓
                  </div>
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    3. Priority Scored ✓
                  </div>
                  <div className={`p-2 rounded border font-semibold ${
                    trackedRequest.isVerifiedByHuman
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}>
                    {trackedRequest.isVerifiedByHuman ? '4. Field Verified ✓' : '4. In Queue'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-slate-600 bg-slate-50/60 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <strong className="text-slate-800">{trackedRequest.reportedLocation.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <strong className="text-slate-800">{trackedRequest.reportedCategory}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Computed Priority Score</span>
                  <strong className="text-blue-600">{trackedRequest.priorityScore.overallScore}/100 ({trackedRequest.priorityScore.indicatorLevel})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cluster Count</span>
                  <strong className="text-slate-800">{trackedRequest.clusterCount} related reports</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 italic text-slate-700 leading-relaxed">
                "{trackedRequest.originalText}"
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                <span>
                  {trackedRequest.isVerifiedByHuman
                    ? `Verified by planning officer: ${trackedRequest.verifiedBy}`
                    : 'Awaiting formal human verification sign-off in the Municipal Queue.'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  SHA-256: {trackedRequest.evidenceList[0]?.sha256Hash?.substring(0, 12) || 'd8a4f1...'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
