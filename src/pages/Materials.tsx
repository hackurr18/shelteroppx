import React, { useState } from 'react';
import { Plus, Check, Layers } from 'lucide-react';
import {
  MaterialItem,
  ShelterConfig,
  PRESET_WALL_ASSEMBLIES
} from '../state/shelterConfig';

interface MaterialsPageProps {
  materials: MaterialItem[];
  config: ShelterConfig;
  onUpdateMaterials: (updated: MaterialItem[]) => void;
  onUpdateConfig: (updated: ShelterConfig) => void;
}

export const Materials: React.FC<MaterialsPageProps> = ({
  materials,
  config,
  onUpdateMaterials,
  onUpdateConfig
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom Composite');
  const [k, setK] = useState('0.45');
  const [density, setDensity] = useState('1400');
  const [cp, setCp] = useState('950');
  const [absorptivity, setAbsorptivity] = useState('0.65');
  const [emissivity, setEmissivity] = useState('0.90');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleAddCustomMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const newMat: MaterialItem = {
      id: trimmed.toLowerCase().replace(/\s+/g, '_'),
      name: trimmed,
      category,
      k: Math.max(0.005, Number(k) || 0.45),
      density: Math.max(10, Number(density) || 1400),
      cp: Math.max(100, Number(cp) || 950),
      absorptivity: Math.min(1, Math.max(0.05, Number(absorptivity) || 0.65)),
      emissivity: Math.min(1, Math.max(0.05, Number(emissivity) || 0.90)),
      description: 'User-defined thermophysical material for high altitude envelope.',
      isCustom: true
    };

    const existingIdx = materials.findIndex(
      (m) => m.name.toLowerCase() === newMat.name.toLowerCase()
    );
    const nextList =
      existingIdx >= 0
        ? materials.map((m, idx) => (idx === existingIdx ? newMat : m))
        : [...materials, newMat];

    onUpdateMaterials(nextList);

    try {
      await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMat)
      });
    } catch {
      // Local state fallback
    }

    setName('');
    setStatusMsg(`Added "${newMat.name}" to the thermophysical library.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleInlinePropertyEdit = (
    id: string,
    field: keyof MaterialItem,
    numValue: number
  ) => {
    const nextList = materials.map((m) =>
      m.id === id ? { ...m, [field]: numValue } : m
    );
    onUpdateMaterials(nextList);
  };

  const applyPresetAssembly = (assemblyName: string) => {
    const layers = PRESET_WALL_ASSEMBLIES[assemblyName];
    if (!layers) return;
    onUpdateConfig({
      ...config,
      walls: {
        assemblyName,
        layers: layers.map((l) => ({ ...l }))
      }
    });
    setStatusMsg(`Applied "${assemblyName}" to active shelter configuration.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Material Disclaimer */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Thermophysical Material Database &amp; Preset Assemblies
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Note: Material properties below are configurable reference values. Edit any property directly or add custom lab-tested composites.
          </p>
        </div>
        {statusMsg && (
          <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-1.5 shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Preset Composite Wall Assemblies */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Reference Composite Wall Assemblies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any assembly to load it directly into the active shelter configuration
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300">
            Active: {config.walls.assemblyName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(PRESET_WALL_ASSEMBLIES).map(([assemblyName, layers]) => {
            const isCurrent = config.walls.assemblyName === assemblyName;
            return (
              <div
                key={assemblyName}
                className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/40'
                    : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {assemblyName}
                    </span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 space-y-1 text-xs font-mono text-slate-300">
                    {layers.map((l, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          {i + 1}. {l.material}
                        </span>
                        <span className="text-slate-400">{Math.round(l.thickness * 1000)} mm</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applyPresetAssembly(assemblyName)}
                  className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-400 text-slate-950 font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isCurrent ? 'Currently Active' : 'Apply Assembly'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Material Database Table & Add Custom Material Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-[#111827] border border-slate-800/90 rounded-xl p-5 overflow-x-auto">
          <h2 className="text-base font-semibold text-white mb-1">
            Configurable Reference Materials
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Modify conductivity (k), density (ρ), specific heat (Cp), or solar absorptivity (α) to immediately recalculate envelope behavior.
          </p>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                <th className="py-2.5 pr-3">Material</th>
                <th className="py-2.5 px-2 text-right">k [W/(m·K)]</th>
                <th className="py-2.5 px-2 text-right">ρ [kg/m³]</th>
                <th className="py-2.5 px-2 text-right">Cp [J/(kg·K)]</th>
                <th className="py-2.5 px-2 text-right">α (Solar)</th>
                <th className="py-2.5 pl-2 text-right">ε (Emiss.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-white">{mat.name}</div>
                    <div className="text-slate-400 text-[11px]">{mat.category}</div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      step={0.005}
                      min={0.005}
                      value={mat.k}
                      onChange={(e) =>
                        handleInlinePropertyEdit(
                          mat.id,
                          'k',
                          Math.max(0.005, Number(e.target.value) || 0.1)
                        )
                      }
                      className="w-20 px-2 py-1 bg-[#0B0F17] border border-slate-700 rounded text-right text-cyan-300 font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      step={50}
                      min={10}
                      value={mat.density}
                      onChange={(e) =>
                        handleInlinePropertyEdit(
                          mat.id,
                          'density',
                          Math.max(10, Number(e.target.value) || 500)
                        )
                      }
                      className="w-20 px-2 py-1 bg-[#0B0F17] border border-slate-700 rounded text-right text-white font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      step={20}
                      min={100}
                      value={mat.cp}
                      onChange={(e) =>
                        handleInlinePropertyEdit(
                          mat.id,
                          'cp',
                          Math.max(100, Number(e.target.value) || 800)
                        )
                      }
                      className="w-20 px-2 py-1 bg-[#0B0F17] border border-slate-700 rounded text-right text-white font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      step={0.05}
                      min={0.05}
                      max={1}
                      value={mat.absorptivity}
                      onChange={(e) =>
                        handleInlinePropertyEdit(
                          mat.id,
                          'absorptivity',
                          Math.min(1, Math.max(0.05, Number(e.target.value) || 0.6))
                        )
                      }
                      className="w-16 px-2 py-1 bg-[#0B0F17] border border-slate-700 rounded text-right text-amber-300 font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 pl-2 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      step={0.02}
                      min={0.05}
                      max={1}
                      value={mat.emissivity}
                      onChange={(e) =>
                        handleInlinePropertyEdit(
                          mat.id,
                          'emissivity',
                          Math.min(1, Math.max(0.05, Number(e.target.value) || 0.9))
                        )
                      }
                      className="w-16 px-2 py-1 bg-[#0B0F17] border border-slate-700 rounded text-right text-slate-300 font-mono tabular-nums"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Custom Material Panel */}
        <form
          onSubmit={handleAddCustomMaterial}
          className="lg:col-span-4 bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Add Custom Material
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define a new composite layer (e.g. Compressed Earth Block, Aerogel, Sheep Wool)
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Material Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ladakhi Sheep Wool Felt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">
                  Conductivity k [W/(m·K)]
                </label>
                <input
                  type="number"
                  step={0.005}
                  min={0.005}
                  required
                  value={k}
                  onChange={(e) => setK(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Density ρ [kg/m³]
                </label>
                <input
                  type="number"
                  step={10}
                  min={5}
                  required
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono text-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Cp [J/(kg·K)]</label>
                <input
                  type="number"
                  step={10}
                  min={100}
                  required
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Absorpt. α</label>
                <input
                  type="number"
                  step={0.05}
                  min={0.05}
                  max={1}
                  required
                  value={absorptivity}
                  onChange={(e) => setAbsorptivity(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Emiss. ε</label>
                <input
                  type="number"
                  step={0.05}
                  min={0.05}
                  max={1}
                  required
                  value={emissivity}
                  onChange={(e) => setEmissivity(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono text-white tabular-nums"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Save Material to Library</span>
          </button>
        </form>
      </div>
    </div>
  );
};
