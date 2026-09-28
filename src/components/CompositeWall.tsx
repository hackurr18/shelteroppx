import React from 'react';
import { Plus, Trash2, ArrowDown } from 'lucide-react';
import {
  ShelterConfig,
  MaterialItem,
  PRESET_WALL_ASSEMBLIES,
  WallLayer
} from '../state/shelterConfig';
import { calculateLiveEnvelopeMetrics, scaleAssemblyLayers } from '../services/api';

interface CompositeWallProps {
  config: ShelterConfig;
  materials: MaterialItem[];
  onChange: (updated: ShelterConfig) => void;
  expertMode?: boolean;
}

export const CompositeWall: React.FC<CompositeWallProps> = ({
  config,
  materials,
  onChange
}) => {
  const { walls } = config;
  const liveMetrics = calculateLiveEnvelopeMetrics(config, materials);

  const handlePresetChange = (presetName: string) => {
    const presetLayers = PRESET_WALL_ASSEMBLIES[presetName];
    if (presetLayers) {
      onChange({
        ...config,
        walls: {
          assemblyName: presetName,
          layers: presetLayers.map((l) => ({ ...l }))
        }
      });
    }
  };

  const handleTotalThicknessQuickScale = (targetMeters: number) => {
    const scaled = scaleAssemblyLayers(walls.layers, targetMeters);
    onChange({
      ...config,
      walls: {
        ...walls,
        layers: scaled
      }
    });
  };

  const updateLayer = (index: number, patch: Partial<WallLayer>) => {
    const nextLayers = walls.layers.map((layer, idx) =>
      idx === index ? { ...layer, ...patch } : layer
    );
    onChange({
      ...config,
      walls: {
        assemblyName: 'Custom Composite',
        layers: nextLayers
      }
    });
  };

  const addLayer = () => {
    if (walls.layers.length >= 6) return;
    onChange({
      ...config,
      walls: {
        assemblyName: 'Custom Composite',
        layers: [...walls.layers, { material: 'Adobe', thickness: 0.10 }]
      }
    });
  };

  const removeLayer = (index: number) => {
    if (walls.layers.length <= 1) return;
    onChange({
      ...config,
      walls: {
        assemblyName: 'Custom Composite',
        layers: walls.layers.filter((_, idx) => idx !== index)
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Preset Assembly & Total Thickness Quick Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Composite Assembly Preset
          </label>
          <select
            value={
              PRESET_WALL_ASSEMBLIES[walls.assemblyName]
                ? walls.assemblyName
                : 'Custom Composite'
            }
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {Object.keys(PRESET_WALL_ASSEMBLIES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Custom Composite" disabled>
              Custom Composite Assembly
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Quick Scale Total Wall Thickness
          </label>
          <div className="flex items-center gap-1.5">
            {[0.3, 0.4, 0.5].map((tVal) => {
              const isSelected = Math.abs(liveMetrics.totalThicknessM - tVal) < 0.015;
              return (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => handleTotalThicknessQuickScale(tVal)}
                  className={`flex-1 py-2 px-2 text-xs font-mono rounded-lg border transition-colors tabular-nums whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B0F17] text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {Math.round(tVal * 1000)} mm
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Outside -> Layers -> Inside Interactive Stack */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-amber-300">EXTERIOR FACE (Ambient Cold &amp; Solar Flux)</span>
          <button
            type="button"
            onClick={addLayer}
            disabled={walls.layers.length >= 6}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-cyan-300 rounded-md flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Layer</span>
          </button>
        </div>

        <div className="space-y-2">
          {walls.layers.map((layer, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-800 rounded-lg p-2.5">
                <span className="font-mono text-xs text-slate-400 w-14 shrink-0 tabular-nums">
                  Layer {index + 1}
                </span>

                <select
                  value={layer.material}
                  onChange={(e) => updateLayer(index, { material: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} (k={m.k} W/m·K)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={20}
                    max={800}
                    step={10}
                    value={Math.round(layer.thickness * 1000)}
                    onChange={(e) => {
                      const mm = Math.max(10, Number(e.target.value) || 100);
                      updateLayer(index, { thickness: Number((mm / 1000).toFixed(3)) });
                    }}
                    className="w-20 px-2 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-md text-xs font-mono text-right text-white tabular-nums focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs font-mono text-slate-400">mm</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeLayer(index)}
                  disabled={walls.layers.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer"
                  title="Remove Layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {index < walls.layers.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="w-3 h-3 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-1 text-xs font-mono text-emerald-400">
          INTERIOR FACE (Living Comfort Volume &amp; Interior Convection h_in)
        </div>
      </div>

      {/* Live Calculated Composite Wall Physics Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="bg-[#0B0F17] border border-slate-800/90 rounded-lg p-2.5">
          <div className="text-xs text-slate-400">Total Thickness</div>
          <div className="mt-1 text-sm font-mono font-semibold text-white tabular-nums">
            {liveMetrics.totalThicknessMm} mm ({liveMetrics.totalThicknessM} m)
          </div>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/90 rounded-lg p-2.5">
          <div className="text-xs text-slate-400">Thermal Resistance (R)</div>
          <div className="mt-1 text-sm font-mono font-semibold text-cyan-300 tabular-nums">
            {liveMetrics.rUnitValue} m²·K/W
          </div>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/90 rounded-lg p-2.5">
          <div className="text-xs text-slate-400">Transmittance (U)</div>
          <div className="mt-1 text-sm font-mono font-semibold text-amber-300 tabular-nums">
            {liveMetrics.uValue} W/(m²·K)
          </div>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/90 rounded-lg p-2.5">
          <div className="text-xs text-slate-400">Sensible Capacity</div>
          <div className="mt-1 text-sm font-mono font-semibold text-emerald-400 tabular-nums">
            {liveMetrics.thermalCapacityGrossMJ} MJ/K
          </div>
        </div>
      </div>
    </div>
  );
};
