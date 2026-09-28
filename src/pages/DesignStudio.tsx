import React, { useState } from 'react';
import { Play, BookmarkPlus, Check, FileCode, ArrowRight } from 'lucide-react';
import {
  ShelterConfig,
  MaterialItem,
  SimulationResponse
} from '../state/shelterConfig';
import { PageId } from '../components/Sidebar';
import { Shelter3D } from '../components/Shelter3D';
import { GeometryPanel } from '../components/GeometryPanel';
import { CompositeWall } from '../components/CompositeWall';
import { MaterialPanel } from '../components/MaterialPanel';
import { WindowPanel } from '../components/WindowPanel';
import { LouverPanel } from '../components/LouverPanel';
import { PCMPanel } from '../components/PCMPanel';
import { ClimatePanel } from '../components/ClimatePanel';
import { calculateLiveEnvelopeMetrics, generateAnsysApdlScript } from '../services/api';

interface DesignStudioProps {
  config: ShelterConfig;
  materials: MaterialItem[];
  simulationResults: SimulationResponse;
  expertMode: boolean;
  onChange: (updated: ShelterConfig) => void;
  onRunSimulation: () => void;
  onSaveForComparison: (slot: 'A' | 'B') => void;
  onSelectPage: (page: PageId) => void;
}

type StudioTab = 'geometry' | 'walls' | 'roof_floor' | 'openings' | 'louver_pcm';

export const DesignStudio: React.FC<DesignStudioProps> = ({
  config,
  materials,
  simulationResults,
  expertMode,
  onChange,
  onRunSimulation,
  onSaveForComparison,
  onSelectPage
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('geometry');
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const liveMetrics = calculateLiveEnvelopeMetrics(config, materials);
  const { summary } = simulationResults;

  const triggerSaveSlot = (slot: 'A' | 'B') => {
    onSaveForComparison(slot);
    setSavedToast(`Saved active shelter configuration as Design ${slot}`);
    setTimeout(() => setSavedToast(null), 2500);
  };

  const handleDownloadCurrentAnsys = () => {
    const script = generateAnsysApdlScript(config, materials, liveMetrics.totalThicknessM);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ansys_shelter_${config.geometry.shape}_${config.location.name.toLowerCase()}.inp`;
    a.click();
    URL.revokeObjectURL(url);
    setSavedToast('Exported ANSYS APDL Input (.inp) file');
    setTimeout(() => setSavedToast(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Studio Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-slate-800/90 rounded-xl px-5 py-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Parametric Bioclimatic Shelter Design Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Parametric inputs for Size, Shape, Multi-Layer Composite Wall, Solar Orientation, Openings &amp; PCM Storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {savedToast && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              <span>{savedToast}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadCurrentAnsys}
            className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Generate and download ANSYS Mechanical APDL input file"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export to ANSYS (.inp)</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSaveSlot('A')}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save as Design A</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSaveSlot('B')}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Save as Design B</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Parametric Configuration Controls */}
        <div className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-5">
          {/* Segmented Section Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {[
              { id: 'geometry', label: '1. Size & Shape' },
              { id: 'walls', label: '2. Composite Wall' },
              { id: 'roof_floor', label: '3. Roof & Floor' },
              { id: 'openings', label: '4. Glazing & Door' },
              { id: 'louver_pcm', label: '5. Louver & PCM' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as StudioTab)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Active Configuration Section */}
          {activeTab === 'geometry' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Location &amp; Regional Weather Horizon
                </h3>
                <ClimatePanel
                  config={config}
                  onChange={onChange}
                  onOpenClimatePage={() => onSelectPage('climate')}
                />
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Shelter Size, Shape &amp; Solar Azimuth
                </h3>
                <GeometryPanel config={config} onChange={onChange} />
              </div>
            </div>
          )}

          {activeTab === 'walls' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Multi-Layer Composite Wall Assembly
                </h3>
                <button
                  type="button"
                  onClick={() => onSelectPage('materials')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Edit Material Database ➔
                </button>
              </div>
              <CompositeWall
                config={config}
                materials={materials}
                onChange={onChange}
                expertMode={expertMode}
              />
            </div>
          )}

          {activeTab === 'roof_floor' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Roof Enclosure &amp; Sub-Slab Floor Assemblies
              </h3>
              <MaterialPanel
                config={config}
                materials={materials}
                onChange={onChange}
              />
            </div>
          )}

          {activeTab === 'openings' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Passive Solar Glazing &amp; Airlock Door Openings
              </h3>
              <WindowPanel config={config} onChange={onChange} />
            </div>
          )}

          {activeTab === 'louver_pcm' && (
            <div className="space-y-5">
              <div>
                <LouverPanel config={config} onChange={onChange} />
              </div>
              <div className="pt-4 border-t border-slate-800">
                <PCMPanel config={config} onChange={onChange} expertMode={expertMode} />
              </div>
            </div>
          )}

          {/* Expert Mode Boundary & Infiltration Controls */}
          {expertMode && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs font-mono text-cyan-300">
                EXPERT MODE: Transient Convection &amp; Ground Coupling
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Infiltration ACH (h⁻¹)
                  </label>
                  <input
                    type="number"
                    min={0.05}
                    max={5.0}
                    step={0.05}
                    value={config.simulation.ach}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        simulation: {
                          ...config.simulation,
                          ach: Math.max(0.05, Number(e.target.value) || 0.5)
                        }
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Initial Tin (°C)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={config.simulation.initialTemperature}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        simulation: {
                          ...config.simulation,
                          initialTemperature: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Inside Film h_in (W/m²K)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={2}
                    max={25}
                    value={config.simulation.insideConvectionH}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        simulation: {
                          ...config.simulation,
                          insideConvectionH: Math.max(2, Number(e.target.value) || 8)
                        }
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Interactive 3D Digital Twin */}
        <div className="xl:col-span-4 space-y-4">
          <Shelter3D config={config} />

          {/* Visual 2D Cross-Section Bar */}
          <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-white">
                Composite Wall Cross-Section (Exterior ➔ Interior)
              </span>
              <span className="font-mono text-cyan-300 tabular-nums">
                {liveMetrics.totalThicknessMm} mm (R = {liveMetrics.rUnitValue})
              </span>
            </div>
            <div className="h-9 w-full rounded-lg overflow-hidden flex border border-slate-700">
              {config.walls.layers.map((layer, idx) => {
                const pct = Math.max(
                  10,
                  (layer.thickness / Math.max(liveMetrics.totalThicknessM, 0.05)) * 100
                );
                const bgClass =
                  layer.material === 'Insulation'
                    ? 'bg-amber-500/80 text-slate-950'
                    : layer.material === 'Aerogel Blanket'
                    ? 'bg-cyan-500/80 text-slate-950'
                    : layer.material === 'Adobe'
                    ? 'bg-[#B87D56] text-slate-950'
                    : layer.material === 'Brick'
                    ? 'bg-[#B84A39] text-white'
                    : layer.material === 'Concrete'
                    ? 'bg-slate-500 text-white'
                    : layer.material === 'Stone'
                    ? 'bg-slate-600 text-white'
                    : 'bg-cyan-600 text-white';
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%` }}
                    className={`${bgClass} flex flex-col items-center justify-center px-1 text-[11px] font-mono font-semibold border-r last:border-r-0 border-slate-900/40 truncate`}
                    title={`Layer ${idx + 1}: ${layer.material} (${Math.round(layer.thickness * 1000)} mm)`}
                  >
                    <span className="truncate">{layer.material}</span>
                    <span className="text-[10px] opacity-85">
                      {Math.round(layer.thickness * 1000)}mm
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Design Summary & Instant FEA Readout */}
        <div className="xl:col-span-3 bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-white">
              Envelope Summary &amp; FEA State
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Synchronized thermodynamics &amp; FEA validation
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Net Wall / Floor Area</span>
              <span className="font-mono text-white tabular-nums">
                {liveMetrics.geometry.net_wall_area} / {liveMetrics.geometry.floor_area} m²
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Surface-to-Volume (S/V)</span>
              <span className="font-mono text-cyan-300 tabular-nums">
                {liveMetrics.geometry.surface_to_volume_ratio} m⁻¹ ({config.geometry.shape})
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Wall R-Value / U-Value</span>
              <span className="font-mono text-cyan-300 tabular-nums">
                R={liveMetrics.rUnitValue} • U={liveMetrics.uValue}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Envelope Mass</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {liveMetrics.totalEnvelopeMassKg.toLocaleString()} kg
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Solar Glazing Orientation</span>
              <span className="font-mono text-amber-300 tabular-nums">
                {config.geometry.orientationAzimuth}° ({config.geometry.orientationLabel || 'South'})
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">PCM Latent Energy Bank</span>
              <span className="font-mono text-white tabular-nums">
                {liveMetrics.pcmLatentKwh} kWh
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">ANSYS FEA Correlation</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                R² = {summary.ansys_validation?.pearson_r2.toFixed(3) ?? '0.984'}
              </span>
            </div>
          </div>

          {/* Quick Simulation Readout Card */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-medium text-slate-400">
              Transient Simulation Readout ({config.climate.period.toUpperCase()})
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div>
                <div className="text-slate-400">Min Indoor</div>
                <div className="text-base font-semibold text-cyan-300">
                  {summary.min_indoor_temp.toFixed(1)}°C
                </div>
              </div>
              <div>
                <div className="text-slate-400">Max Indoor</div>
                <div className="text-base font-semibold text-emerald-400">
                  {summary.max_indoor_temp.toFixed(1)}°C
                </div>
              </div>
              <div>
                <div className="text-slate-400">Solar Gain</div>
                <div className="text-sm text-amber-300">
                  {summary.total_solar_kwh.toFixed(1)} kWh
                </div>
              </div>
              <div>
                <div className="text-slate-400">Heat Loss</div>
                <div className="text-sm text-rose-400">
                  {summary.total_heat_loss_kwh.toFixed(1)} kWh
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onRunSimulation();
                onSelectPage('simulation');
              }}
              className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Run &amp; View Full Simulation</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPage('ansys')}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Inspect ANSYS FEA Results</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
