import React from 'react';
import {
  BookmarkPlus,
  Trash2,
  GitCompare,
  ArrowUpRight,
  FileCode
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  ShelterConfig,
  MaterialItem,
  SavedDesign
} from '../state/shelterConfig';
import { executeTransientSimulationLocal, generateAnsysApdlScript, calculateLiveEnvelopeMetrics } from '../services/api';
import { ChartCard } from '../components/ChartCard';

interface ComparisonPageProps {
  currentConfig: ShelterConfig;
  materials: MaterialItem[];
  designA: SavedDesign | null;
  designB: SavedDesign | null;
  onSaveDesignSlot: (slot: 'A' | 'B', customConfig?: ShelterConfig, label?: string) => void;
  onClearDesignSlot: (slot: 'A' | 'B') => void;
  onLoadConfigIntoStudio: (cfg: ShelterConfig) => void;
}

export const Comparison: React.FC<ComparisonPageProps> = ({
  currentConfig,
  materials,
  designA,
  designB,
  onSaveDesignSlot,
  onClearDesignSlot,
  onLoadConfigIntoStudio
}) => {
  // Enforce Rule 4: Both designs simulated under the EXACT SAME active weather dataset
  const sharedWeather = currentConfig.climate.weatherData;

  const simA = designA
    ? executeTransientSimulationLocal(
        {
          ...designA.config,
          climate: {
            ...currentConfig.climate,
            weatherData: sharedWeather
          }
        },
        materials
      )
    : null;

  const simB = designB
    ? executeTransientSimulationLocal(
        {
          ...designB.config,
          climate: {
            ...currentConfig.climate,
            weatherData: sharedWeather
          }
        },
        materials
      )
    : null;

  const combinedChartData = sharedWeather.map((w, idx) => ({
    time_label: w.timeLabel || `${String(w.hour % 24).padStart(2, '0')}:00`,
    outdoor_temperature: w.temperature,
    design_a_indoor: simA ? simA.hourly_results[idx]?.indoor_temperature : null,
    design_b_indoor: simB ? simB.hourly_results[idx]?.indoor_temperature : null
  }));

  const handleLoadDemoComparisonPair = () => {
    // Design A: Uninsulated Stone (300mm, North 0° Azimuth)
    const cfgA: ShelterConfig = {
      ...currentConfig,
      name: 'Design A: Uninsulated Stone (300mm, North)',
      geometry: {
        ...currentConfig.geometry,
        shape: 'rectangular',
        orientationAzimuth: 0,
        orientationLabel: 'North (0°)'
      },
      walls: {
        assemblyName: 'Uninsulated Stone',
        layers: [{ material: 'Stone', thickness: 0.30 }]
      },
      windows: currentConfig.windows.map((w) => ({ ...w, orientationAzimuth: 0, orientationLabel: 'North' })),
      thermalStorage: { ...currentConfig.thermalStorage, pcmEnabled: false }
    };

    // Design B: Aerogel / Composite (450mm, South 180° Azimuth + PCM)
    const cfgB: ShelterConfig = {
      ...currentConfig,
      name: 'Design B: Adobe Composite (450mm, South + PCM)',
      geometry: {
        ...currentConfig.geometry,
        shape: 'dome',
        orientationAzimuth: 180,
        orientationLabel: 'South (180°)'
      },
      walls: {
        assemblyName: 'Adobe Composite',
        layers: [
          { material: 'Adobe', thickness: 0.175 },
          { material: 'Insulation', thickness: 0.10 },
          { material: 'Adobe', thickness: 0.175 }
        ]
      },
      windows: currentConfig.windows.map((w) => ({ ...w, orientationAzimuth: 180, orientationLabel: 'South' })),
      thermalStorage: {
        pcmEnabled: true,
        material: 'Bio-PCM Q-12 (Low Temp)',
        mass: 300,
        meltingTemp: 12.0,
        latentHeat: 195000
      }
    };

    onSaveDesignSlot('A', cfgA, 'Uninsulated Stone (300mm, North 0°)');
    onSaveDesignSlot('B', cfgB, 'Dome Adobe Composite (450mm, South 180° + PCM)');
  };

  const exportDesignAnsysInp = (slotConfig: ShelterConfig, label: string) => {
    const live = calculateLiveEnvelopeMetrics(slotConfig, materials);
    const script = generateAnsysApdlScript(slotConfig, materials, live.totalThicknessM);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ansys_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.inp`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Controlled Bioclimatic Design Comparison (Design A vs Design B)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Both candidate designs are evaluated under the exact same active weather dataset ({currentConfig.location.name} • {currentConfig.climate.period.toUpperCase()}) for an indisputable, scientifically controlled comparison.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSaveDesignSlot('A')}
            className="px-3 py-2 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-cyan-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Active as Design A</span>
          </button>
          <button
            type="button"
            onClick={() => onSaveDesignSlot('B')}
            className="px-3 py-2 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Active as Design B</span>
          </button>
          <button
            type="button"
            onClick={handleLoadDemoComparisonPair}
            className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Load Benchmark Pair</span>
          </button>
        </div>
      </div>

      {/* Design A & Design B Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A */}
        <div className="bg-[#111827] border border-cyan-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-cyan-400">DESIGN A</div>
              <h2 className="text-base font-semibold text-white">
                {designA ? designA.label : 'No Design Assigned'}
              </h2>
            </div>
            {designA && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDesignAnsysInp(designA.config, 'Design_A')}
                  className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-xs text-cyan-300 rounded-md flex items-center gap-1 cursor-pointer"
                  title="Export Design A to ANSYS APDL"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>ANSYS .inp</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadConfigIntoStudio(designA.config)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit in Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onClearDesignSlot('A')}
                  className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Remove Design A"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {designA && simA ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">Wall Assembly</div>
                <div className="text-white font-sans font-medium mt-0.5 truncate">
                  {designA.config.walls.assemblyName} ({Math.round(simA.summary.wall_thickness_m * 1000)}mm)
                </div>
              </div>
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">Shape &amp; Azimuth</div>
                <div className="text-white mt-0.5 capitalize">
                  {designA.config.geometry.shape} ({designA.config.geometry.orientationAzimuth}°)
                </div>
              </div>
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">R-Value / U-Value</div>
                <div className="text-cyan-300 mt-0.5">
                  R={simA.summary.wall_r_value} • U={simA.summary.wall_u_value}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Click &ldquo;Save Active as Design A&rdquo; to populate this slot.
            </div>
          )}
        </div>

        {/* Card B */}
        <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-amber-400">DESIGN B</div>
              <h2 className="text-base font-semibold text-white">
                {designB ? designB.label : 'No Design Assigned'}
              </h2>
            </div>
            {designB && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDesignAnsysInp(designB.config, 'Design_B')}
                  className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-xs text-amber-300 rounded-md flex items-center gap-1 cursor-pointer"
                  title="Export Design B to ANSYS APDL"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>ANSYS .inp</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadConfigIntoStudio(designB.config)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit in Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onClearDesignSlot('B')}
                  className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Remove Design B"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {designB && simB ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">Wall Assembly</div>
                <div className="text-white font-sans font-medium mt-0.5 truncate">
                  {designB.config.walls.assemblyName} ({Math.round(simB.summary.wall_thickness_m * 1000)}mm)
                </div>
              </div>
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">Shape &amp; Azimuth</div>
                <div className="text-white mt-0.5 capitalize">
                  {designB.config.geometry.shape} ({designB.config.geometry.orientationAzimuth}°)
                </div>
              </div>
              <div className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <div className="text-slate-400">R-Value / U-Value</div>
                <div className="text-amber-300 mt-0.5">
                  R={simB.summary.wall_r_value} • U={simB.summary.wall_u_value}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Modify configuration in Design Studio and click &ldquo;Save Active as Design B&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* Main Comparative Indoor Temperature Curve */}
      <ChartCard
        title="Indoor Air Temperature Comparison (Design A vs Design B)"
        subtitle={`Evaluated under identical ${currentConfig.location.name} weather conditions`}
        rightLabel={`Comfort Threshold: ${currentConfig.simulation.comfortThreshold}°C`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedChartData.slice(0, 72)} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="time_label" stroke="#64748B" fontSize={11} />
            <YAxis stroke="#94A3B8" fontSize={11} unit="°C" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F17',
                borderColor: '#1E293B',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine
              y={currentConfig.simulation.comfortThreshold}
              stroke="#10B981"
              strokeDasharray="4 4"
            />
            {simA && (
              <Line
                type="monotone"
                dataKey="design_a_indoor"
                name={`Design A (${designA?.label}) [°C]`}
                stroke="#22D3EE"
                strokeWidth={3}
                dot={combinedChartData.length <= 24 ? { r: 2 } : false}
              />
            )}
            {simB && (
              <Line
                type="monotone"
                dataKey="design_b_indoor"
                name={`Design B (${designB?.label}) [°C]`}
                stroke="#F59E0B"
                strokeWidth={3}
                dot={combinedChartData.length <= 24 ? { r: 2 } : false}
              />
            )}
            <Line
              type="monotone"
              dataKey="outdoor_temperature"
              name="Outdoor Ambient (°C)"
              stroke="#64748B"
              strokeWidth={1.8}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Side-by-Side Quantitative Metric Matrix */}
      {simA && simB && (
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 overflow-x-auto">
          <h3 className="text-base font-semibold text-white mb-3">
            Quantitative Thermal Performance Matrix
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                <th className="py-2.5 pr-4">Performance Metric</th>
                <th className="py-2.5 px-4 text-right text-cyan-300">
                  Design A ({designA?.label})
                </th>
                <th className="py-2.5 px-4 text-right text-amber-300">
                  Design B ({designB?.label})
                </th>
                <th className="py-2.5 pl-4 text-right">Differential (B - A)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
              {[
                {
                  name: 'Minimum Nighttime Indoor Temp',
                  a: simA.summary.min_indoor_temp,
                  b: simB.summary.min_indoor_temp,
                  unit: '°C'
                },
                {
                  name: 'Maximum Daytime Indoor Temp',
                  a: simA.summary.max_indoor_temp,
                  b: simB.summary.max_indoor_temp,
                  unit: '°C'
                },
                {
                  name: 'Average 24h Indoor Temperature',
                  a: simA.summary.avg_indoor_temp,
                  b: simB.summary.avg_indoor_temp,
                  unit: '°C'
                },
                {
                  name: 'Passive Solar Energy Gain',
                  a: simA.summary.total_solar_kwh,
                  b: simB.summary.total_solar_kwh,
                  unit: 'kWh'
                },
                {
                  name: 'Total Envelope Heat Loss',
                  a: simA.summary.total_heat_loss_kwh,
                  b: simB.summary.total_heat_loss_kwh,
                  unit: 'kWh'
                },
                {
                  name: 'Comfort Maintenance (Hours)',
                  a: simA.summary.comfort_hours,
                  b: simB.summary.comfort_hours,
                  unit: 'hrs'
                },
                {
                  name: 'Peak Thermal Storage Bank',
                  a: simA.summary.peak_thermal_storage_kwh,
                  b: simB.summary.peak_thermal_storage_kwh,
                  unit: 'kWh'
                },
                {
                  name: 'Surface-to-Volume Ratio (S/V)',
                  a: simA.summary.geometry.surface_to_volume_ratio,
                  b: simB.summary.geometry.surface_to_volume_ratio,
                  unit: 'm⁻¹'
                }
              ].map((row) => {
                const diff = Number((row.b - row.a).toFixed(2));
                const sign = diff > 0 ? '+' : '';
                return (
                  <tr key={row.name} className="hover:bg-slate-800/30">
                    <td className="py-2.5 pr-4 font-sans text-slate-200">{row.name}</td>
                    <td className="py-2.5 px-4 text-right text-white">
                      {row.a} {row.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right text-white">
                      {row.b} {row.unit}
                    </td>
                    <td className="py-2.5 pl-4 text-right text-cyan-300">
                      {sign}{diff} {row.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
