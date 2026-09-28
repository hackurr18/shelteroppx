import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Layers,
  CloudSun,
  Activity,
  GitCompare,
  Sliders,
  FileCheck2,
  Info,
  BookOpen
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'design'
  | 'materials'
  | 'climate'
  | 'simulation'
  | 'comparison'
  | 'optimization'
  | 'ansys'
  | 'assumptions'
  | 'project_info';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  locationName: string;
  wallThicknessMm: number;
}

const MAIN_NAV_ITEMS: { id: PageId; label: string; step: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', step: '01', icon: LayoutDashboard },
  { id: 'design', label: 'Design Studio', step: '02', icon: Compass },
  { id: 'materials', label: 'Materials', step: '03', icon: Layers },
  { id: 'climate', label: 'Climate & Data', step: '04', icon: CloudSun },
  { id: 'simulation', label: 'Simulation & FEA', step: '05', icon: Activity },
  { id: 'comparison', label: 'Comparison', step: '06', icon: GitCompare },
  { id: 'optimization', label: 'Optimization', step: '07', icon: Sliders },
  { id: 'ansys', label: 'ANSYS Validation', step: '08', icon: FileCheck2 }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  locationName,
  wallThicknessMm
}) => {
  return (
    <aside className="w-64 shrink-0 bg-[#0F1420] border-r border-slate-800/90 flex flex-col justify-between select-none">
      <div>
        {/* Brand Section */}
        <div className="px-5 py-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold tracking-tight text-white">
              ShelterX
            </span>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              SIH DRDO
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Passive Thermal Digital Twin &amp; ANSYS FEA Platform
          </p>
        </div>

        {/* Primary Workflow Navigation */}
        <div className="px-3 py-4">
          <div className="px-2 mb-2 text-xs font-medium text-slate-400">
            Engineering Workflow
          </div>
          <nav className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums ml-2">
                    {item.step}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Reference & Active Config Summary */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="px-3 py-2.5 bg-[#0B0F17] border border-slate-800/80 rounded-lg text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Target Region</span>
            <span className="font-mono text-slate-200">{locationName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Wall Thickness</span>
            <span className="font-mono text-cyan-300 tabular-nums">{wallThicknessMm} mm</span>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <button
            onClick={() => onSelectPage('project_info')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activePage === 'project_info'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Problem Statement &amp; DRDO Spec</span>
          </button>
          <button
            onClick={() => onSelectPage('assumptions')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activePage === 'assumptions'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Assumptions &amp; Comfort Criteria</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
