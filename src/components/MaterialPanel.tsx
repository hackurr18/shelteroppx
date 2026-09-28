import React from 'react';
import { ShelterConfig, MaterialItem } from '../state/shelterConfig';

interface MaterialPanelProps {
  config: ShelterConfig;
  materials: MaterialItem[];
  onChange: (updated: ShelterConfig) => void;
}

export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  config,
  materials,
  onChange
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Roof Configuration */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="text-xs font-semibold text-white">Roof Enclosure Assembly</div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Roof Material</label>
          <select
            value={config.roof.material}
            onChange={(e) =>
              onChange({
                ...config,
                roof: { ...config.roof, material: e.target.value }
              })
            }
            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} (k={m.k} W/m·K)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Roof Thickness (mm)
          </label>
          <input
            type="number"
            min={50}
            max={600}
            step={25}
            value={Math.round(config.roof.thickness * 1000)}
            onChange={(e) => {
              const mm = Math.max(50, Number(e.target.value) || 200);
              onChange({
                ...config,
                roof: { ...config.roof, thickness: Number((mm / 1000).toFixed(3)) }
              });
            }}
            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Floor Configuration */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="text-xs font-semibold text-white">Floor Slab Assembly (Ground Buffered)</div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Floor Material</label>
          <select
            value={config.floor.material}
            onChange={(e) =>
              onChange({
                ...config,
                floor: { ...config.floor, material: e.target.value }
              })
            }
            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} (k={m.k} W/m·K)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Floor Thickness (mm)
          </label>
          <input
            type="number"
            min={50}
            max={600}
            step={25}
            value={Math.round(config.floor.thickness * 1000)}
            onChange={(e) => {
              const mm = Math.max(50, Number(e.target.value) || 200);
              onChange({
                ...config,
                floor: { ...config.floor, thickness: Number((mm / 1000).toFixed(3)) }
              });
            }}
            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
