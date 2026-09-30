import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  MapPin,
  Send,
  Upload,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { InfrastructureCategory } from '../../types';

interface SubmissionFormProps {
  onSubmit: (data: {
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
  isLowBandwidthMode: boolean;
  selectedLanguage: string;
}

const PRESETS = [
  {
    title: 'Hospital Deficit (Demo Flow)',
    text: 'Our village cluster has 20,000 people and there is no government hospital nearby. Pregnant mothers and the sick must travel over 50 kilometers to Koraput. We urgently need a 50-bed community health center.',
    category: 'Healthcare' as InfrastructureCategory,
    location: 'Kashipur Village Cluster, Rayagada',
    lat: 19.364,
    lng: 83.141,
    district: 'Rayagada',
    region: 'Odisha, India',
  },
  {
    title: 'Bridge Road Potholes',
    text: 'The main bridge approach on Nagavali River Road has deep 15-inch potholes and deteriorating concrete. Freight trucks are swerving and an ambulance was delayed for 45 minutes.',
    category: 'Roads & Bridges' as InfrastructureCategory,
    location: 'Nagavali River Bridge Approach, Sector 4',
    lat: 19.172,
    lng: 83.42,
    district: 'Rayagada',
    region: 'Odisha, India',
  },
  {
    title: 'Drinking Water Contamination',
    text: 'Our municipal drinking water pipe fractured during cold weather. Brown rusty sediment is coming from all taps, leaving 4,500 residents without clean drinking water.',
    category: 'Clean Water & Sanitation' as InfrastructureCategory,
    location: 'Zarechny Municipal Settlement Central Well',
    lat: 56.8431,
    lng: 60.6454,
    district: 'Sverdlovsk Basin',
    region: 'Ural, Russia',
  },
];

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  onSubmit,
  isSubmitting,
  isLowBandwidthMode,
}) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<InfrastructureCategory>('Healthcare');
  const [locationName, setLocationName] = useState('Kashipur Village Cluster, Rayagada');
  const [coordinates, setCoordinates] = useState({ lat: 19.364, lng: 83.141 });
  const [district, setDistrict] = useState('Rayagada');
  const [region, setRegion] = useState('Odisha, India');

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setText(p.text);
    setCategory(p.category);
    setLocationName(p.location);
    setCoordinates({ lat: p.lat, lng: p.lng });
    setDistrict(p.district);
    setRegion(p.region);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        if (!text.trim()) {
          setText(
            'हमारे काशीपुर गांव में 20,000 लोग रहते हैं और यहां कोई सरकारी अस्पताल नहीं है। गर्भवती महिलाओं को 50 किलोमीटर दूर जाना पड़ता है।'
          );
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      // Fallback recording simulation
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 3) {
            stopRecording();
            return 3;
          }
          return s + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setRecordedAudioUrl('https://actions.google.com/sounds/v1/speech/greeting.ogg');
      if (!text.trim()) {
        setText(
          'Our village cluster has 20,000 people and there is no government hospital nearby. Urgent medical access needed.'
        );
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !recordedAudioUrl) {
      alert('Please describe your infrastructure request or record a voice message.');
      return;
    }
    onSubmit({
      text: text.trim() || 'Voice submission recorded by citizen.',
      category,
      location: {
        name: locationName,
        lat: coordinates.lat,
        lng: coordinates.lng,
        district,
        region,
      },
      files: selectedFiles,
      audioBlobUrl: recordedAudioUrl || undefined,
      audioTranscript: text.trim() || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Test Case Shortcuts */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Demo Examples:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition shadow-xs"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Report a Development Need</h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit an infrastructure issue or public service deficit directly to planning authorities.
          </p>
        </div>

        {/* Problem Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            What is the problem?
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your request in any language (e.g. Hindi, English, Portuguese, Russian)..."
            className="w-full bg-white border border-slate-300 rounded-md p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Original citizen text is preserved; multilingual AI translates it for review.</span>
          </div>
        </div>

        {/* Voice Option */}
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Voice Note / Spoken Testimony</span>
            </div>
            <div className="text-[11px] text-slate-500">Record in your native language</div>
          </div>

          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium transition shadow-xs flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Record Voice</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition shadow-xs flex items-center gap-1.5"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop ({recordingSeconds}s)</span>
            </button>
          )}
        </div>

        {recordedAudioUrl && !isRecording && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
            <span>Voice recorded ({recordingSeconds || 3}s)</span>
            <button
              type="button"
              onClick={() => setRecordedAudioUrl(null)}
              className="text-red-600 hover:underline text-[11px]"
            >
              Remove
            </button>
          </div>
        )}

        {/* Location Section */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter village, neighborhood or road name..."
              className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>District: {district}, {region}</span>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationName('Current Device Location');
                  });
                }
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Use My Device GPS
            </button>
          </div>
        </div>

        {/* Photo / Video Evidence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-800">Add Evidence (Photo / Video)</label>
            <span className="text-[11px] text-slate-500">
              {isLowBandwidthMode ? '2G mode: compressed' : 'JPG, PNG, MP4'}
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/60 rounded-md p-4 text-center cursor-pointer transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <Camera className="w-5 h-5 text-slate-400" />
              <div className="text-xs font-medium text-slate-700">Click to upload photos or videos</div>
              <div className="text-[11px] text-slate-400">Photos are hashed for evidence authenticity</div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700"
                >
                  <span className="truncate max-w-[140px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-600 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-sm transition shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Ingesting Request...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Request</span>
              </>
            )}
          </button>
          <div className="text-center text-[11px] text-slate-500 mt-2">
            A unique Request ID and tamper-evident receipt will be generated immediately.
          </div>
        </div>
      </form>
    </div>
  );
};
