import React from 'react';
import { HelpCircle } from 'lucide-react';
import { ShelterConfig, LouverConfig } from '../state/shelterConfig';
import { calculateLouverShadingFactor } from '../services/api';

interface LouverPanelProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
}

export const LouverPanel: React.FC<LouverPanelProps> = ({ config, onChange }) => {
  const primaryWindow = config.windows[0] || {
    id: 'win-1',
    area: 2.4,
    orientationAzimuth: 180,
    type: 'double_glazed',
    louver: { enabled: false, angle: 30, depth: 0.2, spacing: 0.2 }
  };

  const louver = primaryWindow.louver;
  const noonTransmission = calculateLouverShadingFactor(louver, 12, config.location.latitude);

  const updateLouver = (patch: Partial<LouverConfig>) => {
    const nextLouver = { ...louver, ...patch };
    const nextWin = { ...primaryWindow, louver: nextLouver };
    onChange({
      ...config,
      windows: [nextWin, ...config.windows.slice(1)]
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            Exterior Solar Louver Shading System
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs text-slate-400"
            title="Controls direct solar radiation entering the glazing."
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          </span>
        </div>
        <button
          type="button"
          onClick={() => updateLouver({ enabled: !louver.enabled })}
          className={`px-3 py-1 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
            louver.enabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-[#0B0F17] text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {louver.enabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Controls solar heat intake to eliminate noon overheating in high-altitude direct sun. Shading factor is derived from blade tilt angle, depth, and solar altitude.
      </p>

      {louver.enabled && (
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Blade Angle (°)
              </label>
              <input
                type="number"
                min={0}
                max={75}
                step={5}
                value={louver.angle}
                onChange={(e) =>
                  updateLouver({ angle: Math.min(75, Math.max(0, Number(e.target.value) || 0)) })
                }
                className="w-full px-3 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Blade Depth (m)
              </label>
              <input
                type="number"
                min={0.05}
                max={0.6}
                step={0.05}
                value={louver.depth}
                onChange={(e) =>
                  updateLouver({ depth: Math.max(0.05, Number(e.target.value) || 0.2) })
                }
                className="w-full px-3 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Blade Spacing (m)
              </label>
              <input
                type="number"
                min={0.05}
                max={0.6}
                step={0.05}
                value={louver.spacing}
                onChange={(e) =>
                  updateLouver({ spacing: Math.max(0.05, Number(e.target.value) || 0.2) })
                }
                className="w-full px-3 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400">Calculated Noon Solar Transmission</span>
            <span className="font-mono text-amber-300 tabular-nums">
              {Math.round(noonTransmission * 100)}% ({Math.round((1 - noonTransmission) * 100)}% shaded)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
