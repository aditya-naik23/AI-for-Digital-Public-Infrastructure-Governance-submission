import React from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Activity, HelpCircle, FileCode2, Globe2, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  activeView: 'authority' | 'citizen';
  onSelectView: (view: 'authority' | 'citizen') => void;
  authorityTab: string;
  onSelectAuthorityTab: (tab: string) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onOpenDemoTour: () => void;
  onOpenArchitectureModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeView,
  onSelectView,
  authorityTab,
  onSelectAuthorityTab,
  selectedLanguage,
  onSelectLanguage,
  onOpenDemoTour,
  onOpenArchitectureModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full shadow-xs">
      {/* 1. TOP BRAND & OPERATOR UTILITY STRIP */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between border-b border-slate-100 text-xs">
        {/* Left: Brand Identity & Sovereign Node */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            {/* Geometric Sovereign DPI Emblem */}
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[11px] shadow-xs">
              IP
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                InfraPulse
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
                DPI Governance
              </span>
            </div>
          </div>

          <div className="h-3.5 w-px bg-slate-200 hidden md:block" />

          {/* Node Status Pill */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-700">BRICS Sovereign Node #41</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono text-[10px]">District Rayagada (Odisha)</span>
          </div>
        </div>

        {/* Right: Mode Switcher + Operator Profile + Utilities */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mode Switcher: Authority vs Citizen */}
          <div className="flex items-center rounded-md border border-slate-200 p-0.5 bg-slate-100/80 text-[11px]">
            <button
              onClick={() => onSelectView('authority')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                activeView === 'authority'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Authority Console
            </button>
            <button
              onClick={() => onSelectView('citizen')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                activeView === 'citizen'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Portal
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />

          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600">
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="bg-transparent border-0 text-[11px] text-slate-700 cursor-pointer focus:outline-none font-medium pr-1"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="pt">PT</option>
              <option value="zh">中文</option>
              <option value="ru">RU</option>
            </select>
          </div>

          {/* Tour / Specs Shortcuts */}
          <button
            onClick={onOpenDemoTour}
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            title="Step-by-step pipeline walkthrough"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tour</span>
          </button>

          <button
            onClick={onOpenArchitectureModal}
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            title="System Architecture & DPG Standard"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Specs</span>
          </button>

          {/* Profile User Select */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 sm:border-l-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
            />
            <select
              aria-label="Authority Profile"
              value={currentUser.id}
              onChange={(e) => {
                const u = allUsers.find((x) => x.id === e.target.value);
                if (u) onSelectUser(u);
              }}
              className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5 max-w-[125px] sm:max-w-[150px] truncate cursor-pointer focus:outline-none focus:border-blue-600"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name.split(' ')[0]} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY APPLICATION NAVIGATION BAR */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
        {activeView === 'authority' ? (
          <nav className="flex items-center space-x-1 sm:space-x-4 min-w-max">
            {[
              { id: 'dashboard', label: 'Overview', desc: 'Main Command' },
              { id: 'requests', label: 'Citizen Requests', desc: 'Ingestion Queue' },
              { id: 'hotspots', label: 'Geospatial Intelligence', desc: 'GIS Clusters' },
              { id: 'evidence', label: 'Evidence & Priority', desc: 'CV & Formula' },
              { id: 'projects', label: 'Capital Projects', desc: 'Works & Impact' },
              { id: 'admin', label: 'Governance & Weights', desc: 'Admin & Audit' },
            ].map((item) => {
              const isActive = authorityTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectAuthorityTab(item.id)}
                  className={`h-10 inline-flex items-center px-2.5 sm:px-3 border-b-2 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Public Citizen Service Portal — Multimodal Problem Ingestion & Request Tracker</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Free Public DPI Service • Aadhaar / CPF Sovereign Protected
            </div>
          </div>
        )}

        {/* Right side telemetry indicator */}
        {activeView === 'authority' && (
          <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span className="text-slate-400">Telemetry:</span>
            <span className="text-slate-700 font-medium">96.8% CV Auth</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-medium">5 Hotspots</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
              DPG Standard 1.2
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
