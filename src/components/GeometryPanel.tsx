import React from 'react';
import { ShelterConfig, SIZE_PRESETS, SHAPE_OPTIONS, AZIMUTH_ORIENTATIONS, azimuthToOrientationLabel } from '../state/shelterConfig';

interface GeometryPanelProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
}

export const GeometryPanel: React.FC<GeometryPanelProps> = ({ config, onChange }) => {
  const { geometry } = config;

  const updateGeometry = (patch: Partial<ShelterConfig['geometry']>) => {
    const nextGeom = { ...geometry, ...patch };
    if (patch.orientationAzimuth !== undefined) {
      nextGeom.orientationLabel = azimuthToOrientationLabel(patch.orientationAzimuth);
    }
    // Keep primary window orientation aligned if orientation is updated
    const nextWindows = patch.orientationAzimuth !== undefined
      ? config.windows.map((w, idx) =>
          idx === 0
            ? {
                ...w,
                orientationAzimuth: patch.orientationAzimuth!,
                orientationLabel: azimuthToOrientationLabel(patch.orientationAzimuth!)
              }
            : w
        )
      : config.windows;

    onChange({
      ...config,
      geometry: nextGeom,
      windows: nextWindows
    });
  };

  const handleApplySizePreset = (preset: typeof SIZE_PRESETS[0]) => {
    updateGeometry({
      length: preset.length,
      width: preset.width,
      height: preset.height
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Size Presets */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Standard Shelter Size Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SIZE_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(geometry.length - preset.length) < 0.1 &&
              Math.abs(geometry.width - preset.width) < 0.1;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplySizePreset(preset)}
                className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-[#0B0F17] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">{preset.label.split('(')[0]}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{preset.length}x{preset.width}x{preset.height}m</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parametric Dimension Inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Length L (m)
          </label>
          <input
            type="number"
            min={2}
            max={25}
            step={0.5}
            value={geometry.length}
            onChange={(e) => updateGeometry({ length: Math.max(2, Number(e.target.value) || 6) })}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Width W (m)
          </label>
          <input
            type="number"
            min={2}
            max={20}
            step={0.5}
            value={geometry.width}
            onChange={(e) => updateGeometry({ width: Math.max(2, Number(e.target.value) || 4) })}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Height H (m)
          </label>
          <input
            type="number"
            min={2}
            max={6}
            step={0.2}
            value={geometry.height}
            onChange={(e) => updateGeometry({ height: Math.max(2, Number(e.target.value) || 3) })}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Shape & Orientation Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Bioclimatic Shelter Shape
          </label>
          <select
            value={geometry.shape}
            onChange={(e) =>
              updateGeometry({
                shape: e.target.value as ShelterConfig['geometry']['shape']
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {SHAPE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            {SHAPE_OPTIONS.find((s) => s.id === geometry.shape)?.desc}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">
              Solar Azimuth Orientation
            </label>
            <span className="text-xs font-mono text-cyan-300">
              {geometry.orientationAzimuth}° ({azimuthToOrientationLabel(geometry.orientationAzimuth)})
            </span>
          </div>
          <select
            value={geometry.orientationAzimuth}
            onChange={(e) =>
              updateGeometry({
                orientationAzimuth: Number(e.target.value)
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {AZIMUTH_ORIENTATIONS.map((az) => (
              <option key={az.azimuth} value={az.azimuth}>
                {az.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={345}
              step={15}
              value={geometry.orientationAzimuth}
              onChange={(e) => updateGeometry({ orientationAzimuth: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
