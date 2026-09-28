import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  ArrowRight,
  FileCode,
  Award,
  Download,
  Flame,
  Check
} from 'lucide-react';
import {
  ShelterConfig,
  MaterialItem,
  OptimizationResponse,
  OptimizationCandidate,
  PRESET_WALL_ASSEMBLIES,
  SHAPE_OPTIONS,
  SIZE_PRESETS,
  AZIMUTH_ORIENTATIONS
} from '../state/shelterConfig';
import { runOptimizationAPI, generateAnsysApdlScript, generateWorkbenchPythonScript } from '../services/api';
import { PageId } from '../components/Sidebar';

interface OptimizationPageProps {
  config: ShelterConfig;
  materials: MaterialItem[];
  onApplyCandidate: (candidate: OptimizationCandidate) => void;
  onSelectPage: (page: PageId) => void;
}

const ALL_ASSEMBLIES = Object.keys(PRESET_WALL_ASSEMBLIES);
const ALL_THICKNESSES = [0.3, 0.4, 0.5];
const ALL_SHAPES: ('rectangular' | 'cylindrical' | 'dome' | 'a_frame')[] = [
  'rectangular',
  'cylindrical',
  'dome',
  'a_frame'
];
const ALL_AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315];
const ALL_WINDOW_AREAS = [1.5, 2.4, 3.6];

export const Optimization: React.FC<OptimizationPageProps> = ({
  config,
  materials,
  onApplyCandidate,
  onSelectPage
}) => {
  const [selectedAssemblies, setSelectedAssemblies] = useState<string[]>([
    'Adobe Composite',
    'Stone Composite',
    'Aerogel Ultra-Shield'
  ]);
  const [selectedThicknesses, setSelectedThicknesses] = useState<number[]>([0.3, 0.4, 0.5]);
  const [selectedShapes, setSelectedShapes] = useState<('rectangular' | 'cylindrical' | 'dome' | 'a_frame')[]>([
    'rectangular',
    'dome',
    'cylindrical'
  ]);
  const [selectedSizes, setSelectedSizes] = useState<typeof SIZE_PRESETS>(SIZE_PRESETS.slice(0, 2));
  const [selectedAzimuths, setSelectedAzimuths] = useState<number[]>([0, 90, 180, 270]);
  const [selectedWindowAreas, setSelectedWindowAreas] = useState<number[]>([1.5, 2.4, 3.6]);
  const [comfortThreshold, setComfortThreshold] = useState<number>(config.simulation.comfortThreshold);

  const [optResponse, setOptResponse] = useState<OptimizationResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [filterFeasibleOnly, setFilterFeasibleOnly] = useState(false);
  const [appliedCandidateId, setAppliedCandidateId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const totalCombinationsCount =
    selectedAssemblies.length *
    selectedThicknesses.length *
    selectedShapes.length *
    selectedSizes.length *
    selectedAzimuths.length *
    selectedWindowAreas.length;

  const handleRunGridSearch = async () => {
    setRunning(true);
    const sizeObjects = selectedSizes.map((s) => ({
      length: s.length,
      width: s.width,
      height: s.height,
      sizeLabel: s.label
    }));

    const res = await runOptimizationAPI(
      config,
      materials,
      selectedAssemblies.length ? selectedAssemblies : ALL_ASSEMBLIES,
      selectedThicknesses.length ? selectedThicknesses : ALL_THICKNESSES,
      selectedShapes.length ? selectedShapes : ALL_SHAPES,
      sizeObjects,
      selectedAzimuths.length ? selectedAzimuths : [180],
      selectedWindowAreas.length ? selectedWindowAreas : [2.4],
      comfortThreshold
    );
    setOptResponse(res);
    setRunning(false);
  };

  useEffect(() => {
    handleRunGridSearch();
  }, []);

  const toggleItem = <T,>(list: T[], item: T, setter: (val: T[]) => void) => {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleExportCandidateAnsys = (cand: OptimizationCandidate) => {
    const candidateConfig: ShelterConfig = {
      ...config,
      geometry: {
        ...config.geometry,
        shape: cand.shape,
        length: cand.length,
        width: cand.width,
        height: cand.height,
        orientationAzimuth: cand.orientationAzimuth,
        orientationLabel: cand.orientationLabel
      },
      walls: {
        assemblyName: cand.assembly,
        layers: cand.layers
      },
      windows: [
        {
          id: 'opt-win',
          area: cand.windowArea,
          orientationAzimuth: cand.orientationAzimuth,
          orientationLabel: cand.orientationLabel,
          type: config.windows[0]?.type || 'double_glazed',
          louver: config.windows[0]?.louver || { enabled: false, angle: 30, depth: 0.2, spacing: 0.2 }
        }
      ]
    };

    const script = generateAnsysApdlScript(candidateConfig, materials, cand.thickness);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ansys_opt_${cand.id}_${cand.shape}_${cand.assembly.toLowerCase().replace(/[^a-z0-9]/g, '_')}.inp`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ANSYS script for ${cand.id}`);
    setTimeout(() => setExportNotice(null), 2500);
  };

  const displayedCandidates = optResponse
    ? filterFeasibleOnly
      ? optResponse.candidates.filter((c) => c.meets_constraint)
      : optResponse.candidates
    : [];

  const finalEfficientDesign = optResponse?.final_efficient_design;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
              SIH26051 MULTI-PARAMETRIC OPTIMIZER
            </span>
            <span className="text-xs font-mono text-emerald-400">
              Material + Size + Shape + Orientation + Glazing
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-white mt-1">
            Bioclimatic Design Space Exploration &amp; ANSYS Export
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explores {totalCombinationsCount} candidate configurations under identical {config.location.name} weather conditions to determine the globally optimal passive shelter design.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {exportNotice && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800 px-2 py-1 rounded">
              <Check className="w-3.5 h-3.5" />
              <span>{exportNotice}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleRunGridSearch}
            disabled={running}
            className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>
              {running ? 'Evaluating Candidates...' : `Run Grid Optimization (${totalCombinationsCount} Runs)`}
            </span>
          </button>
        </div>
      </div>

      {/* WINNER SPOTLIGHT: FINAL EFFICIENT DESIGN (Spec Section 26 / Requirement 7) */}
      {finalEfficientDesign && (
        <div className="bg-gradient-to-r from-emerald-950/50 via-[#111827] to-cyan-950/40 border-2 border-emerald-500/50 rounded-xl p-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Award className="w-5 h-5" />
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                  RECOMMENDED FINAL EFFICIENT SHELTER DESIGN (#{finalEfficientDesign.rank} / {optResponse?.total_combinations})
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  Score: {finalEfficientDesign.score}/100
                </span>
              </div>

              <h2 className="text-xl font-bold text-white font-display">
                {finalEfficientDesign.shape.toUpperCase()} • {finalEfficientDesign.assembly} ({Math.round(finalEfficientDesign.thickness * 1000)}mm) • {finalEfficientDesign.orientationLabel}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {finalEfficientDesign.efficiency_justification}
              </p>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
                <div className="p-2.5 bg-[#0B0F17] border border-emerald-800/80 rounded-lg">
                  <div className="text-[11px] text-emerald-400 font-semibold">Thermal Comfort</div>
                  <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                    {finalEfficientDesign.comfort_hours} / 24 hrs ({finalEfficientDesign.comfort_percentage}%)
                  </div>
                </div>
                <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Dimensions (LxWxH)</div>
                  <div className="text-xs font-mono font-semibold text-white mt-0.5">
                    {finalEfficientDesign.length}×{finalEfficientDesign.width}×{finalEfficientDesign.height}m
                  </div>
                </div>
                <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Min Temp (Comfort)</div>
                  <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                    {finalEfficientDesign.min_temp.toFixed(1)}°C (≥ {comfortThreshold}°C)
                  </div>
                </div>
                <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">24h Heat Loss</div>
                  <div className="text-xs font-mono font-semibold text-rose-400 mt-0.5">
                    {finalEfficientDesign.heat_loss_kwh.toFixed(1)} kWh
                  </div>
                </div>
                <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Solar Gain</div>
                  <div className="text-xs font-mono font-semibold text-amber-300 mt-0.5">
                    {finalEfficientDesign.solar_gain_kwh.toFixed(1)} kWh
                  </div>
                </div>
                <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Glazing Window</div>
                  <div className="text-xs font-mono font-semibold text-cyan-300 mt-0.5">
                    {finalEfficientDesign.windowArea} m² ({finalEfficientDesign.orientationLabel.split(' ')[0]})
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions for Efficient Design */}
            <div className="flex flex-col gap-2.5 shrink-0 justify-center">
              <button
                type="button"
                onClick={() => handleExportCandidateAnsys(finalEfficientDesign)}
                className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Download ANSYS Mechanical APDL .inp script for the winning design"
              >
                <FileCode className="w-4 h-4 fill-slate-950" />
                <span>Export Efficient Design to ANSYS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyCandidate(finalEfficientDesign);
                  setAppliedCandidateId(finalEfficientDesign.id);
                  onSelectPage('design');
                }}
                className="px-4 py-2.5 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Apply as Active Shelter</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Parameter Domain Checkbox Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Shapes & Sizes */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-white">
            1. Bioclimatic Shapes ({selectedShapes.length}/4)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SHAPE_OPTIONS.map((sh) => {
              const active = selectedShapes.includes(sh.id as any);
              return (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => toggleItem(selectedShapes, sh.id as any, setSelectedShapes)}
                  className={`p-2 rounded-lg text-xs font-medium text-left border transition-colors cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white truncate">{sh.label.split('(')[0]}</div>
                  <div className="text-[10px] text-slate-400">{active ? '✓ Included' : 'Excluded'}</div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-white mb-2">
              Dimensions &amp; Size Presets ({selectedSizes.length}/4)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SIZE_PRESETS.map((sz) => {
                const active = selectedSizes.some((s) => s.label === sz.label);
                return (
                  <button
                    key={sz.label}
                    type="button"
                    onClick={() => {
                      if (active && selectedSizes.length > 1) {
                        setSelectedSizes(selectedSizes.filter((s) => s.label !== sz.label));
                      } else if (!active) {
                        setSelectedSizes([...selectedSizes, sz]);
                      }
                    }}
                    className={`p-2 rounded-lg text-xs text-left border transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-white truncate">{sz.label.split('(')[0]}</div>
                    <div className="text-[10px] font-mono text-slate-400">{sz.length}x{sz.width}m</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Wall Assemblies & Thicknesses */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-white">
            2. Composite Assemblies ({selectedAssemblies.length}/{ALL_ASSEMBLIES.length})
          </div>
          <div className="space-y-1.5">
            {ALL_ASSEMBLIES.map((aName) => {
              const active = selectedAssemblies.includes(aName);
              return (
                <button
                  key={aName}
                  type="button"
                  onClick={() => toggleItem(selectedAssemblies, aName, setSelectedAssemblies)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                  }`}
                >
                  <span>{aName}</span>
                  <span className="font-mono text-[11px]">{active ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-white mb-2">
              Wall Thicknesses
            </div>
            <div className="flex gap-2">
              {ALL_THICKNESSES.map((t) => {
                const active = selectedThicknesses.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleItem(selectedThicknesses, t, setSelectedThicknesses)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono border transition-colors tabular-nums cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                    }`}
                  >
                    {Math.round(t * 1000)} mm
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Orientations, Windows & Comfort Criteria */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-white">
            3. Solar Orientations (0°-360°) &amp; Glazing
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { az: 0, label: '0° N' },
              { az: 45, label: '45° NE' },
              { az: 90, label: '90° E' },
              { az: 135, label: '135° SE' },
              { az: 180, label: '180° S' },
              { az: 225, label: '225° SW' },
              { az: 270, label: '270° W' },
              { az: 315, label: '315° NW' }
            ].map((o) => {
              const active = selectedAzimuths.includes(o.az);
              return (
                <button
                  key={o.az}
                  type="button"
                  onClick={() => toggleItem(selectedAzimuths, o.az, setSelectedAzimuths)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-mono border text-center transition-colors cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-white mb-1.5">
              Window Areas (m²)
            </div>
            <div className="flex gap-2">
              {ALL_WINDOW_AREAS.map((wa) => {
                const active = selectedWindowAreas.includes(wa);
                return (
                  <button
                    key={wa}
                    type="button"
                    onClick={() => toggleItem(selectedWindowAreas, wa, setSelectedWindowAreas)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#0B0F17] text-slate-400 border-slate-800'
                    }`}
                  >
                    {wa} m²
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-white mb-1">
              Minimum Comfort Threshold (°C)
            </label>
            <input
              type="number"
              step={0.5}
              value={comfortThreshold}
              onChange={(e) => setComfortThreshold(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Candidate Designs Table (Spec Section 25) */}
      {optResponse && (
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Parametric Candidate Designs Evaluated ({optResponse.candidates.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {optResponse.objective_description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterFeasibleOnly(!filterFeasibleOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterFeasibleOnly
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-[#0B0F17] text-slate-300 border-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {filterFeasibleOnly
                    ? `Showing Feasible Only (${optResponse.feasible_count})`
                    : `Show All (${optResponse.total_combinations})`}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                  <th className="py-2.5 px-2">Rank</th>
                  <th className="py-2.5 px-2">Shape</th>
                  <th className="py-2.5 px-2">Dimensions</th>
                  <th className="py-2.5 px-2">Assembly</th>
                  <th className="py-2.5 px-2 text-right">Thickness</th>
                  <th className="py-2.5 px-2">Orientation</th>
                  <th className="py-2.5 px-2 text-right">Glazing</th>
                  <th className="py-2.5 px-2 text-right text-emerald-400">Comfort Hours</th>
                  <th className="py-2.5 px-2 text-right">Min Temp</th>
                  <th className="py-2.5 px-2 text-right">Heat Loss</th>
                  <th className="py-2.5 px-2 text-right">Score</th>
                  <th className="py-2.5 px-2">Constraint</th>
                  <th className="py-2.5 pl-2 text-right">Export &amp; Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
                {displayedCandidates.slice(0, 50).map((cand) => {
                  const isApplied = appliedCandidateId === cand.id;
                  const isWinner = cand.isBestDesign;
                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isWinner ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 font-semibold">
                        {isWinner ? (
                          <span className="text-amber-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>#1</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">#{cand.rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 font-sans font-medium text-white capitalize">
                        {cand.shape}
                      </td>
                      <td className="py-2.5 px-2 text-slate-300">
                        {cand.length}×{cand.width}m
                      </td>
                      <td className="py-2.5 px-2 font-sans text-slate-200">
                        {cand.assembly}
                      </td>
                      <td className="py-2.5 px-2 text-right text-cyan-300">
                        {Math.round(cand.thickness * 1000)}mm
                      </td>
                      <td className="py-2.5 px-2 text-slate-200">
                        {cand.orientationLabel}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-300">
                        {cand.windowArea} m²
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                        {cand.comfort_hours}h ({cand.comfort_percentage}%)
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-semibold ${
                          cand.meets_constraint ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {cand.min_temp.toFixed(1)}°C
                      </td>
                      <td className="py-2.5 px-2 text-right text-rose-400">
                        {cand.heat_loss_kwh.toFixed(1)} kWh
                      </td>
                      <td className="py-2.5 px-2 text-right text-cyan-300 font-semibold">
                        {cand.score}
                      </td>
                      <td className="py-2.5 px-2">
                        {cand.meets_constraint ? (
                          <span className="text-emerald-400 font-sans">✓ Satisfied</span>
                        ) : (
                          <span className="text-slate-500 font-sans">Below {comfortThreshold}°C</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExportCandidateAnsys(cand)}
                            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Download ANSYS APDL .inp script"
                          >
                            <FileCode className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onApplyCandidate(cand);
                              setAppliedCandidateId(cand.id);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-sans font-medium transition-colors whitespace-nowrap cursor-pointer ${
                              isApplied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-slate-200'
                            }`}
                          >
                            {isApplied ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
