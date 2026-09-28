import React from 'react';
import { ShelterConfig, PCM_MATERIALS } from '../state/shelterConfig';

interface PCMPanelProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
  expertMode?: boolean;
}

export const PCMPanel: React.FC<PCMPanelProps> = ({ config, onChange, expertMode = false }) => {
  const { thermalStorage } = config;

  const updatePCM = (patch: Partial<ShelterConfig['thermalStorage']>) => {
    onChange({
      ...config,
      thermalStorage: { ...thermalStorage, ...patch }
    });
  };

  const handlePresetChange = (name: string) => {
    const found = PCM_MATERIALS.find((p) => p.name === name);
    if (found) {
      updatePCM({
        material: found.name,
        meltingTemp: found.melting_temp,
        latentHeat: found.latent_heat
      });
    } else {
      updatePCM({ material: name });
    }
  };

  const latentCapacityKwh = thermalStorage.pcmEnabled
    ? (thermalStorage.mass * thermalStorage.latentHeat) / 3.6e6
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white">
            Phase Change Material (PCM) Latent Thermal Bank
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stores excess daytime solar heat as latent enthalpy of fusion and discharges it to prevent indoor freezing after dark
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            updatePCM({
              pcmEnabled: !thermalStorage.pcmEnabled,
              mass: !thermalStorage.pcmEnabled && thermalStorage.mass <= 0 ? 250 : thermalStorage.mass,
              material: thermalStorage.material || PCM_MATERIALS[2].name
            })
          }
          className={`px-3 py-1 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
            thermalStorage.pcmEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-[#0B0F17] text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {thermalStorage.pcmEnabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      {thermalStorage.pcmEnabled && (
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                PCM Material Composition
              </label>
              <select
                value={thermalStorage.material || PCM_MATERIALS[2].name}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {PCM_MATERIALS.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (T_melt = {p.melting_temp}°C)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                PCM Active Mass (kg)
              </label>
              <input
                type="number"
                min={25}
                max={3000}
                step={25}
                value={thermalStorage.mass}
                onChange={(e) =>
                  updatePCM({ mass: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Phase Change Melting Temp T_m (°C)
              </label>
              <input
                type="number"
                step={0.5}
                disabled={!expertMode}
                value={thermalStorage.meltingTemp}
                onChange={(e) =>
                  updatePCM({ meltingTemp: Number(e.target.value) || 12 })
                }
                className="w-full px-3 py-1.5 bg-[#0B0F17] border border-slate-700 disabled:opacity-60 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Latent Heat of Fusion L (J/kg)
              </label>
              <input
                type="number"
                step={5000}
                disabled={!expertMode}
                value={thermalStorage.latentHeat}
                onChange={(e) =>
                  updatePCM({ latentHeat: Math.max(50000, Number(e.target.value) || 180000) })
                }
                className="w-full px-3 py-1.5 bg-[#0B0F17] border border-slate-700 disabled:opacity-60 rounded-lg text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Latent Energy Bank: Q_latent = m · L</span>
            <span className="font-mono text-cyan-300 tabular-nums">
              {latentCapacityKwh.toFixed(2)} kWh stored
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
