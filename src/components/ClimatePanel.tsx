import React from 'react';
import { ShelterConfig, LOCATION_PRESETS } from '../state/shelterConfig';
import { generateSyntheticWeatherForLocation } from '../services/api';

interface ClimatePanelProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
  onOpenClimatePage?: () => void;
}

export const ClimatePanel: React.FC<ClimatePanelProps> = ({
  config,
  onChange,
  onOpenClimatePage
}) => {
  const handleSelectLocation = (presetName: string) => {
    const preset = LOCATION_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;

    const updatedWeather =
      config.climate.source === 'synthetic_demo' || config.climate.source === 'drdo_experimental'
        ? generateSyntheticWeatherForLocation(preset.name, preset.elevation, config.climate.period)
        : config.climate.weatherData;

    onChange({
      ...config,
      location: {
        name: preset.name,
        latitude: preset.latitude,
        longitude: preset.longitude,
        elevation: preset.elevation
      },
      climate: {
        ...config.climate,
        weatherData: updatedWeather
      }
    });
  };

  const handlePeriodChange = (period: '24h' | '7d' | '30d') => {
    const updatedWeather = generateSyntheticWeatherForLocation(
      config.location.name,
      config.location.elevation,
      period
    );
    onChange({
      ...config,
      climate: {
        ...config.climate,
        period,
        weatherData: updatedWeather
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Target Climate Region
          </label>
          <select
            value={
              LOCATION_PRESETS.some((p) => p.name === config.location.name)
                ? config.location.name
                : 'Custom'
            }
            onChange={(e) => handleSelectLocation(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {LOCATION_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
            <option value="Custom" disabled>
              Custom ({config.location.name})
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Simulation Time Horizon
          </label>
          <div className="flex items-center gap-1.5 p-0.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`flex-1 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  config.climate.period === p
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#0B0F17] border border-slate-800/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums">
        <span>Lat: {config.location.latitude}°N</span>
        <span>•</span>
        <span>Lon: {config.location.longitude}°E</span>
        <span>•</span>
        <span>Elev: {config.location.elevation}m</span>
        {onOpenClimatePage && (
          <button
            type="button"
            onClick={onOpenClimatePage}
            className="text-cyan-400 hover:underline cursor-pointer ml-auto"
          >
            Configure Climate Source ➔
          </button>
        )}
      </div>
    </div>
  );
};
