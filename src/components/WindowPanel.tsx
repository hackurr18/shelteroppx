import React from 'react';
import { ShelterConfig, WindowConfig, AZIMUTH_ORIENTATIONS, azimuthToOrientationLabel } from '../state/shelterConfig';
import { WINDOW_PROPS } from '../services/api';

interface WindowPanelProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
}

export const WindowPanel: React.FC<WindowPanelProps> = ({ config, onChange }) => {
  const primaryWindow = config.windows[0] || {
    id: 'win-1',
    area: 2.4,
    orientationAzimuth: 180,
    orientationLabel: 'South',
    type: 'double_glazed',
    louver: { enabled: false, angle: 30, depth: 0.2, spacing: 0.2 }
  };

  const updateWindow = (patch: Partial<WindowConfig>) => {
    const nextWin = { ...primaryWindow, ...patch };
    if (patch.orientationAzimuth !== undefined) {
      nextWin.orientationLabel = azimuthToOrientationLabel(patch.orientationAzimuth);
    }
    onChange({
      ...config,
      windows: [nextWin, ...config.windows.slice(1)]
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Primary Window Area (m²)
          </label>
          <input
            type="number"
            min={0.2}
            max={15.0}
            step={0.2}
            value={primaryWindow.area}
            onChange={(e) => updateWindow({ area: Math.max(0.1, Number(e.target.value) || 0) })}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Window Solar Azimuth
          </label>
          <select
            value={primaryWindow.orientationAzimuth ?? 180}
            onChange={(e) =>
              updateWindow({
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
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Glazing Technology
          </label>
          <select
            value={primaryWindow.type}
            onChange={(e) =>
              updateWindow({
                type: e.target.value as WindowConfig['type']
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {Object.entries(WINDOW_PROPS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Door Configuration */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Shelter Airlock Door Area (m²)
          </label>
          <input
            type="number"
            min={1.2}
            max={5.0}
            step={0.1}
            value={config.door.area}
            onChange={(e) =>
              onChange({
                ...config,
                door: {
                  ...config.door,
                  area: Math.max(1.0, Number(e.target.value) || 2.1)
                }
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-col justify-end">
          <div className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
            <span>Insulated Cold-Climate Door U-Value</span>
            <span className="font-mono text-cyan-300 tabular-nums">
              {config.door.uValue ?? 1.8} W/(m²·K)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
