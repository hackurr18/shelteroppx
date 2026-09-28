import React from 'react';
import { Play, RotateCcw, FileCode, Check } from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  expertMode: boolean;
  onToggleExpertMode: (expert: boolean) => void;
  onLoadDemo: () => void;
  onRunSimulation: () => void;
  onQuickExportAnsys: () => void;
  isSimulating: boolean;
  ansysExportNotice?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  expertMode,
  onToggleExpertMode,
  onLoadDemo,
  onRunSimulation,
  onQuickExportAnsys,
  isSimulating,
  ansysExportNotice
}) => {
  return (
    <header className="h-14 shrink-0 bg-[#0F1420] border-b border-slate-800/90 px-6 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectPage('dashboard');
          }}
          className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap"
        >
          ShelterX
        </a>
        <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
          Bioclimatic CFD &amp; FEA Engine
        </span>
      </div>

      {/* Zone 2: 5 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectPage('design')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'design' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          Design Studio
        </button>
        <button
          onClick={() => onSelectPage('climate')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'climate' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          Climate &amp; Data
        </button>
        <button
          onClick={() => onSelectPage('simulation')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'simulation' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          Simulation &amp; FEA
        </button>
        <button
          onClick={() => onSelectPage('comparison')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'comparison' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          Comparison
        </button>
        <button
          onClick={() => onSelectPage('optimization')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'optimization' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          Optimization
        </button>
        <button
          onClick={() => onSelectPage('ansys')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activePage === 'ansys' ? 'text-white underline underline-offset-8 decoration-cyan-400' : ''
          }`}
        >
          ANSYS Validation
        </button>
      </nav>

      {/* Zone 3: Mode Selector + Primary Actions */}
      <div className="flex items-center gap-2.5">
        {ansysExportNotice && (
          <span className="hidden md:flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-1 rounded">
            <Check className="w-3.5 h-3.5" />
            <span>{ansysExportNotice}</span>
          </span>
        )}

        {/* Simple Mode / Expert Mode Segmented Control */}
        <div className="flex items-center p-0.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleExpertMode(false)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              !expertMode
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => onToggleExpertMode(true)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              expertMode
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expert Mode
          </button>
        </div>

        <button
          type="button"
          onClick={onLoadDemo}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Load DRDO Ladakh Winter Benchmark"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Load Demo</span>
        </button>

        <button
          type="button"
          onClick={onQuickExportAnsys}
          className="px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Download Current Model as ANSYS Mechanical APDL Input (.inp)"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export ANSYS</span>
        </button>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </div>
    </header>
  );
};
