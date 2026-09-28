import React, { useState } from 'react';
import {
  Flame,
  Scale,
  Sun,
  ShieldCheck,
  TrendingDown,
  Building2,
  Droplets,
  Zap,
  Info,
  Layers,
  ArrowRight
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
  Legend,
  ReferenceLine
} from 'recharts';
import {
  ShelterConfig,
  MaterialItem,
  SimulationResponse
} from '../state/shelterConfig';
import {
  calculateTask3HeatFlowDetails,
  Task3HeatFlowDetails
} from '../services/api';

interface HeatBalanceMatrixProps {
  config: ShelterConfig;
  materials: MaterialItem[];
  simulationResults: SimulationResponse;
}

export const HeatBalanceMatrix: React.FC<HeatBalanceMatrixProps> = ({
  config,
  materials,
  simulationResults
}) => {
  const [showComponentLines, setShowComponentLines] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'envelope_only'>('all');

  const details: Task3HeatFlowDetails = calculateTask3HeatFlowDetails(
    config,
    materials,
    simulationResults
  );

  const solarCoveragePercent =
    details.totalPeriodLossKwh > 0
      ? Math.min(100, Math.round((details.totalPeriodSolarGainKwh / details.totalPeriodLossKwh) * 100))
      : 100;

  // Filter or prepare chart data
  const chartData = details.sortedDeltaTPoints.map((pt) => ({
    ...pt,
    deltaTLabel: `${pt.deltaT.toFixed(1)}°C`
  }));

  return (
    <div className="space-y-6">
      {/* Task 3 Header Banner */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
              OFFICIAL TASK 3 DELIVERABLE • SIH26051 DRDO
            </span>
            <span className="text-xs font-mono text-amber-400">
              Fourier Heat Flow vs. Temperature Difference (ΔT)
            </span>
          </div>
          <h2 className="font-display text-xl font-bold text-white mt-1">
            Heat Flow Details vs. Temperature Difference (T_in - T_amb) &amp; Energy Balance Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates envelope conductive loss, glazing conduction, and air infiltration as a direct function of thermal gradient (ΔT) across {config.climate.period.toUpperCase()} horizon ({details.periodHours} hours).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0B0F17] border border-slate-800 rounded-lg p-2 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-mono">BUILDING CONDUCTANCE</div>
            <div className="text-base font-bold font-mono text-cyan-300">
              UA = {details.totalConductanceUA} W/K
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800 mx-1"></div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-mono">EQUILIBRIUM ΔT</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              +{details.balancePointDeltaT}°C
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Thermal Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Thermal Conductance</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {details.totalConductanceUA}{' '}
            <span className="text-xs font-normal text-slate-400">W/K</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Envelope: {details.envelopeConductanceUA} W/K</span>
            <span className="text-cyan-400">Inf: {details.infiltrationConductanceUA} W/K</span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Temperature Difference (ΔT)</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            +{details.avgDeltaT}°C{' '}
            <span className="text-xs font-normal text-slate-400">avg</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Range: +{details.minDeltaT}°C (day) to +{details.maxDeltaT}°C (night blizzard)
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Simulated Energy Loss</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {details.totalPeriodLossKwh}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Rate: {details.totalConductanceUA} W per 1.0°C indoor-outdoor lift
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Passive Solar Trapped</span>
            <Sun className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {details.totalPeriodSolarGainKwh}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            {solarCoveragePercent}% Solar Thermal Offset ({details.netThermalDeficitKwh} kWh net deficit)
          </div>
        </div>
      </div>

      {/* CHART: Dedicated Q vs. Delta T Characteristic Curve */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                Characteristic Conduction Curve
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400 font-mono">Q = UA · ΔT (W)</span>
            </div>
            <h3 className="font-display text-base font-bold text-white mt-0.5">
              Heat Flow Rate (Watts) as a Function of Temperature Difference (T_in - T_amb)
            </h3>
            <p className="text-xs text-slate-400">
              Each point represents simulated hourly operating conditions sorted by temperature difference ΔT. The slope represents the effective thermal conductance (UA = {details.totalConductanceUA} W/K).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowComponentLines(!showComponentLines)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showComponentLines
                  ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showComponentLines ? 'Hide Component Lines' : 'Show Component Lines'}
            </button>
          </div>
        </div>

        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="deltaT"
                stroke="#64748B"
                fontSize={11}
                unit="°C"
                type="number"
                domain={['auto', 'auto']}
                name="ΔT"
              />
              <YAxis stroke="#94A3B8" fontSize={11} unit="W" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#1E293B',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: any) => [`${value} W`, name]}
                labelFormatter={(label) => `Temperature Lift ΔT: +${label}°C`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {/* Equilibrium Reference Line */}
              <ReferenceLine
                x={details.balancePointDeltaT}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: `Solar Equilibrium (+${details.balancePointDeltaT}°C)`,
                  fill: '#10B981',
                  fontSize: 11,
                  position: 'insideTopLeft'
                }}
              />

              {/* Passive Solar Gain Area */}
              <Area
                type="monotone"
                dataKey="solarGainW"
                name="Passive Solar Input (W)"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.15}
                strokeWidth={1.8}
              />

              {/* Total Heat Loss Line */}
              <Line
                type="monotone"
                dataKey="totalLossW"
                name="Total Heat Loss Q_total (W)"
                stroke="#F43F5E"
                strokeWidth={3}
                dot={{ r: 2 }}
              />

              {/* Theoretical UA Slope Line */}
              <Line
                type="monotone"
                dataKey="theoreticalUaLossW"
                name={`Theoretical Linear Slope (UA = ${details.totalConductanceUA} W/K)`}
                stroke="#64748B"
                strokeWidth={1.8}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Individual Component Lines (Toggleable) */}
              {showComponentLines && (
                <>
                  <Line
                    type="monotone"
                    dataKey="wallLossW"
                    name="Wall Conduction (W)"
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="roofLossW"
                    name="Roof Conduction (W)"
                    stroke="#F472B6"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="windowLossW"
                    name="Glazing Windows (W)"
                    stroke="#FBBF24"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="infiltrationLossW"
                    name="Infiltration Loss (W)"
                    stroke="#34D399"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="floorLossW"
                    name="Floor Slab (W)"
                    stroke="#A78BFA"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Physical Interpretation:</strong> Under freezing night conditions (ΔT = +{details.maxDeltaT}°C), total envelope heat loss peaks at{' '}
              <span className="font-mono text-rose-300 font-semibold">
                {Math.round(details.totalConductanceUA * details.maxDeltaT)} W
              </span>. During peak daylight, passive solar gain offsets this entirely up to ΔT = +{details.balancePointDeltaT}°C without auxiliary fuel.
            </span>
          </div>
        </div>
      </div>

      {/* HEAT BALANCE MATRIX TABLE */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
              Component-by-Component Energy Balance Matrix
            </span>
            <h3 className="font-display text-base font-bold text-white mt-0.5">
              Cumulative Heat Flow &amp; Thermal Conductance by Envelope Subsystem
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Simulated Horizon: {details.periodHours} Hours ({config.climate.period.toUpperCase()})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Subsystem / Element</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Dimension</th>
                <th className="py-2.5 px-3 text-right">U-Value [W/(m²·K)]</th>
                <th className="py-2.5 px-3 text-right">Conductance UA [W/K]</th>
                <th className="py-2.5 px-3 text-right">Cumulative Loss [kWh]</th>
                <th className="py-2.5 px-3 text-right">Share [%]</th>
                <th className="py-2.5 px-3 min-w-[130px]">Relative Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
              {details.components.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    ></span>
                    <span>{c.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{c.category}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {c.areaOrVolume.toFixed(2)} {c.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-300">{c.uValue.toFixed(3)}</td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold">
                    {c.uaValue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300 font-semibold">
                    {c.cumulativeLossKwh.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {c.percentageShare}%
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.percentageShare}%`,
                          backgroundColor: c.color
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#0B0F17] font-mono border-t-2 border-slate-700 text-white">
              <tr>
                <td className="py-3 px-3 font-bold" colSpan={4}>
                  TOTAL SHELTER ENVELOPE + INFILTRATION
                </td>
                <td className="py-3 px-3 text-right font-bold text-cyan-300 text-sm">
                  {details.totalConductanceUA} W/K
                </td>
                <td className="py-3 px-3 text-right font-bold text-rose-300 text-sm">
                  {details.totalPeriodLossKwh} kWh
                </td>
                <td className="py-3 px-3 text-right font-bold text-white">100.0%</td>
                <td className="py-3 px-3">
                  <div className="text-[10px] text-emerald-400 font-sans">
                    Offset: {details.totalPeriodSolarGainKwh} kWh solar
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* DELTA T SENSITIVITY & MILITARY LOGISTICS FUEL DISPLACEMENT */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase">
                Defence Logistics Impact Matrix
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400 font-mono">Bukhari SKO Fuel Replacement</span>
            </div>
            <h3 className="font-display text-base font-bold text-white mt-0.5">
              Heat Loss Rate &amp; Equivalent Fossil Fuel Demand Across Operating ΔT Scenarios
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates heating power and fuel requirement needed to maintain indoor comfort if solar passive gain were absent, based on standard Indian Army high-altitude Bukkhari heaters (Kerosene SKO, 7.0 kWh useful heat/L, ₹180/L transport cost to forward posts).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Scenario ΔT (Lift)</th>
                <th className="py-2.5 px-3">Typical Arctic/Ladakh Condition</th>
                <th className="py-2.5 px-3 text-right">Heat Loss Rate [W]</th>
                <th className="py-2.5 px-3 text-right">Heat Loss Rate [kW]</th>
                <th className="py-2.5 px-3 text-right">Envelope Flux [W/m²]</th>
                <th className="py-2.5 px-3 text-right">24h Deficit [kWh/day]</th>
                <th className="py-2.5 px-3 text-right text-amber-300">Equivalent Kerosene [L/day]</th>
                <th className="py-2.5 px-3 text-right text-emerald-300">Logistics Cost [₹/day]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
              {details.sensitivityTable.map((row, idx) => {
                let conditionLabel = 'Sunny afternoon';
                if (row.deltaT === 10) conditionLabel = 'Mild cold (0°C outside, +10°C inside)';
                if (row.deltaT === 15) conditionLabel = 'Winter twilight (-5°C outside, +10°C inside)';
                if (row.deltaT === 20) conditionLabel = 'Standard winter night (-10°C outside, +10°C inside)';
                if (row.deltaT === 25) conditionLabel = 'Severe sub-zero night (-15°C outside, +10°C inside)';
                if (row.deltaT === 30) conditionLabel = 'Extreme cold front (-20°C outside, +10°C inside)';
                if (row.deltaT === 35) conditionLabel = 'High-altitude blizzard / Dras (-25°C outside, +10°C inside)';
                if (row.deltaT === 40) conditionLabel = 'Siachen extreme cold (-30°C outside, +10°C inside)';

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      row.deltaT === Math.round(details.avgDeltaT)
                        ? 'bg-cyan-950/20 border-l-2 border-cyan-400'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-cyan-300">+{row.deltaT}°C</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{conditionLabel}</td>
                    <td className="py-2.5 px-3 text-right text-white">{row.lossRateW.toLocaleString()} W</td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-semibold">{row.lossRateKw} kW</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row.heatFluxWm2} W/m²</td>
                    <td className="py-2.5 px-3 text-right text-rose-300 font-semibold">{row.dailyKwh} kWh</td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                      {row.keroseneLitersPerDay} L/day
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                      ₹{row.dailyCostInr.toLocaleString()}/day
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
