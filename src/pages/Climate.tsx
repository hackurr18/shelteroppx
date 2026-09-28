import React, { useState } from 'react';
import {
  CloudDownload,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FlaskConical
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  ShelterConfig,
  LOCATION_PRESETS,
  DRDO_LADAKH_EXPERIMENTAL_BENCHMARK
} from '../state/shelterConfig';
import {
  generateSyntheticWeatherForLocation,
  fetchOpenMeteoWeatherAPI,
  parseWeatherCsvText
} from '../services/api';
import { ChartCard } from '../components/ChartCard';

interface ClimatePageProps {
  config: ShelterConfig;
  onChange: (updated: ShelterConfig) => void;
}

export const Climate: React.FC<ClimatePageProps> = ({ config, onChange }) => {
  const [customName, setCustomName] = useState(config.location.name);
  const [latInput, setLatInput] = useState(String(config.location.latitude));
  const [lonInput, setLonInput] = useState(String(config.location.longitude));
  const [elevInput, setElevInput] = useState(String(config.location.elevation));
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const weatherData = config.climate.weatherData || [];

  const handleSelectPresetLocation = (presetName: string) => {
    const preset = LOCATION_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setCustomName(preset.name);
    setLatInput(String(preset.latitude));
    setLonInput(String(preset.longitude));
    setElevInput(String(preset.elevation));
    setErrorMessage(null);

    const synthetic = generateSyntheticWeatherForLocation(
      preset.name,
      preset.elevation,
      config.climate.period
    );

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
        source: 'synthetic_demo',
        weatherData: synthetic
      }
    });
    setStatusMessage(`Loaded regional climate profile for ${preset.name} (${config.climate.period.toUpperCase()}).`);
  };

  const handlePeriodChange = (period: '24h' | '7d' | '30d') => {
    const updated = generateSyntheticWeatherForLocation(
      config.location.name,
      config.location.elevation,
      period
    );
    onChange({
      ...config,
      climate: {
        ...config.climate,
        period,
        weatherData: updated
      }
    });
    setStatusMessage(`Switched simulation period to ${period.toUpperCase()} (${updated.length} hourly time-steps).`);
  };

  const handleLoadDrdoBenchmark = () => {
    const drdoHourly = DRDO_LADAKH_EXPERIMENTAL_BENCHMARK.map((pt) => ({
      hour: pt.hour,
      temperature: pt.ambient,
      solar: pt.solar,
      wind: pt.wind,
      dayIndex: 1,
      timeLabel: `${String(pt.hour).padStart(2, '0')}:00`
    }));

    onChange({
      ...config,
      location: {
        name: 'DRDO Ladakh High-Altitude Station',
        latitude: 34.15,
        longitude: 77.57,
        elevation: 3500
      },
      climate: {
        ...config.climate,
        source: 'drdo_experimental',
        period: '24h',
        weatherData: drdoHourly
      }
    });
    setStatusMessage('Loaded DRDO Ladakh High-Altitude Station Experimental Thermocouple Dataset.');
  };

  const handleApplyCustomCoordinates = () => {
    const lat = Number(latInput);
    const lon = Number(lonInput);
    const elev = Number(elevInput);
    if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lon) || lon < -180 || lon > 180) {
      setErrorMessage('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setErrorMessage(null);
    const locName = customName.trim() || 'Custom Location';
    const synthetic = generateSyntheticWeatherForLocation(locName, elev || 2500, config.climate.period);

    onChange({
      ...config,
      location: {
        name: locName,
        latitude: lat,
        longitude: lon,
        elevation: elev || 2500
      },
      climate: {
        ...config.climate,
        source: 'synthetic_demo',
        weatherData: synthetic
      }
    });
    setStatusMessage(`Applied coordinates (${lat}°N, ${lon}°E, ${elev}m) and synthesized cold-climate weather.`);
  };

  const handleFetchOpenMeteo = async () => {
    setLoadingWeather(true);
    setErrorMessage(null);
    setStatusMessage(null);
    const lat = Number(latInput) || config.location.latitude;
    const lon = Number(lonInput) || config.location.longitude;
    const elev = Number(elevInput) || config.location.elevation;
    const locName = customName.trim() || config.location.name;

    const res = await fetchOpenMeteoWeatherAPI(lat, lon, locName, elev, config.climate.period);
    setLoadingWeather(false);

    onChange({
      ...config,
      location: {
        name: locName,
        latitude: lat,
        longitude: lon,
        elevation: elev
      },
      climate: {
        ...config.climate,
        source: res.source as ShelterConfig['climate']['source'],
        weatherData: res.hourly
      }
    });

    if (res.warning) {
      setErrorMessage(res.warning);
    } else {
      setStatusMessage(
        `Fetched live Open-Meteo weather for ${locName} (${lat}°N, ${lon}°E). Active dataset updated.`
      );
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const parsed = parseWeatherCsvText(text);
        onChange({
          ...config,
          climate: {
            ...config.climate,
            source: 'csv',
            weatherData: parsed,
            csvFileName: file.name
          }
        });
        setStatusMessage(
          `Uploaded "${file.name}" (${parsed.length} hourly records). Active simulation weather updated.`
        );
      } catch (err: any) {
        setErrorMessage(
          err?.message || 'Invalid CSV format. Please provide hour,temperature,solar,wind.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadDemoCsv = () => {
    const header = 'hour,temperature,solar,wind\n';
    const rows = weatherData
      .map((pt) => `${pt.hour},${pt.temperature},${pt.solar},${pt.wind}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelterx_weather_${config.location.name.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const minTemp = Math.min(...weatherData.map((d) => d.temperature));
  const maxTemp = Math.max(...weatherData.map((d) => d.temperature));
  const peakSolar = Math.max(...weatherData.map((d) => d.solar));
  const avgWind =
    weatherData.reduce((a, d) => a + d.wind, 0) / Math.max(1, weatherData.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Climatic Boundary Condition &amp; Weather Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure hourly diurnal temperature, solar radiation, and wind boundaries across 24h, 7-day, or 30-day time horizons.
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-300 bg-[#0B0F17] border border-slate-800 px-3 py-2 rounded-lg shrink-0">
          Source: {config.climate.source.toUpperCase()} ({config.climate.period.toUpperCase()} • {weatherData.length} hrs)
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Time Horizon Selector (24h, 7d, 30d) - Strongly Recommended #11 */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-white">Simulation Time Horizon:</span>
          <p className="text-xs text-slate-400 mt-0.5">
            Test candidate shelters under single-day design extremes, 7-day blizzard waves, or month-long winter cold.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                config.climate.period === p
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === '24h' ? '24-Hour Design Day' : p === '7d' ? '7-Day Cold Wave' : '30-Day Sub-Zero'}
            </button>
          ))}
        </div>
      </div>

      {/* Region Presets & Weather Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Location Presets & Coordinates */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            1. Select High-Altitude Region or Coordinates
          </h2>
          <div className="flex flex-wrap gap-2">
            {LOCATION_PRESETS.map((preset) => {
              const isSelected = config.location.name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPresetLocation(preset.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {preset.name} ({preset.elevation}m)
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Latitude (°N)</label>
              <input
                type="number"
                step={0.01}
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Longitude (°E)</label>
              <input
                type="number"
                step={0.01}
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Elevation (m)</label>
              <input
                type="number"
                step={50}
                value={elevInput}
                onChange={(e) => setElevInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-white tabular-nums"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyCustomCoordinates}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer"
          >
            Apply Coordinates
          </button>
        </div>

        {/* 4 Weather Source Options */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            2. Weather Data Mode (DRDO Experimental Benchmark Available)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DRDO Experimental Benchmark */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                config.climate.source === 'drdo_experimental'
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-[#0B0F17] border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>DRDO Field Benchmark</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Measured thermocouple winter dataset from Ladakh field station (-16°C to +2.8°C ambient, 940 W/m² solar).
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadDrdoBenchmark}
                className="mt-3 w-full py-1.5 px-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-xs font-medium text-cyan-300 rounded-lg transition-colors cursor-pointer"
              >
                Load DRDO Benchmark
              </button>
            </div>

            {/* Live Open-Meteo API */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                config.climate.source === 'open_meteo'
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-[#0B0F17] border-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">
                  Live Open-Meteo API
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fetch live satellite &amp; numerical weather prediction data for selected coordinates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchOpenMeteo}
                disabled={loadingWeather}
                className="mt-3 w-full py-1.5 px-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>{loadingWeather ? 'Fetching...' : 'Fetch Live Weather'}</span>
              </button>
            </div>

            {/* Synthetic Regional Diurnal Demo */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                config.climate.source === 'synthetic_demo'
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-[#0B0F17] border-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">
                  Synthetic Diurnal Solver
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cold-region solar &amp; temperature model calibrated to altitude lapse rate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPresetLocation('Ladakh')}
                className="mt-3 w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer"
              >
                Use Synthetic Profile
              </button>
            </div>

            {/* Upload Custom CSV */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                config.climate.source === 'csv'
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-[#0B0F17] border-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">
                  Upload Weather CSV
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload custom hourly file (hour, temperature, solar, wind).
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDownloadDemoCsv}
                  className="p-1.5 bg-[#0B0F17] border border-slate-700 hover:text-cyan-300 rounded-lg text-slate-400 cursor-pointer"
                  title="Download CSV Template"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats of Active Weather */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#111827] border border-slate-800/90 rounded-xl">
          <div className="text-xs text-slate-400">Min Outdoor Temp</div>
          <div className="text-lg font-mono font-semibold text-blue-400 tabular-nums mt-1">
            {minTemp.toFixed(1)}°C
          </div>
        </div>
        <div className="p-3 bg-[#111827] border border-slate-800/90 rounded-xl">
          <div className="text-xs text-slate-400">Max Outdoor Temp</div>
          <div className="text-lg font-mono font-semibold text-emerald-400 tabular-nums mt-1">
            {maxTemp.toFixed(1)}°C
          </div>
        </div>
        <div className="p-3 bg-[#111827] border border-slate-800/90 rounded-xl">
          <div className="text-xs text-slate-400">Peak Solar Irradiance</div>
          <div className="text-lg font-mono font-semibold text-amber-300 tabular-nums mt-1">
            {peakSolar.toFixed(0)} W/m²
          </div>
        </div>
        <div className="p-3 bg-[#111827] border border-slate-800/90 rounded-xl">
          <div className="text-xs text-slate-400">Average Wind Speed</div>
          <div className="text-lg font-mono font-semibold text-cyan-300 tabular-nums mt-1">
            {avgWind.toFixed(1)} m/s
          </div>
        </div>
      </div>

      {/* Weather Profile Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Ambient Temperature & Wind Boundary Profile"
          subtitle={`Diurnal ambient outdoor temperature and wind velocity across ${weatherData.length} hourly steps`}
          rightLabel={`Location: ${config.location.name}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weatherData.slice(0, 72)} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748B"
                fontSize={11}
              />
              <YAxis yAxisId="temp" stroke="#38BDF8" fontSize={11} unit="°C" />
              <YAxis yAxisId="wind" orientation="right" stroke="#34D399" fontSize={11} unit="m/s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#1E293B',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Outdoor Temp (°C)"
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={weatherData.length <= 24 ? { r: 2 } : false}
              />
              <Line
                yAxisId="wind"
                type="monotone"
                dataKey="wind"
                name="Wind Speed (m/s)"
                stroke="#34D399"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Global Incident Shortwave Solar Radiation Profile"
          subtitle="Hourly incident solar irradiance driving direct glazing transmission and opaque sol-air heat flux"
          rightLabel={`Peak: ${peakSolar.toFixed(0)} W/m²`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weatherData.slice(0, 72)} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748B"
                fontSize={11}
              />
              <YAxis stroke="#FBBF24" fontSize={11} unit="W/m²" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#1E293B',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="solar"
                name="Solar Radiation (W/m²)"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
