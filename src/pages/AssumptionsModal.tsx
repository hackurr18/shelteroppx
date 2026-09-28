import React from 'react';
import { ShelterConfig } from '../state/shelterConfig';

interface AssumptionsPageProps {
  config: ShelterConfig;
  mode: 'assumptions' | 'project_info';
}

export const AssumptionsPage: React.FC<AssumptionsPageProps> = ({ config, mode }) => {
  if (mode === 'project_info') {
    return (
      <div className="space-y-6">
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 space-y-3">
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded inline-block">
            SMART INDIA HACKATHON 2026 • CHALLENGE #51 (SIH26051)
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Software Based Model Development for Design of Area Specific Shelter for Thermal Comfort Maintenance
          </h1>
          <div className="text-xs font-mono text-slate-400 space-y-1">
            <div>Sponsoring Organization: <strong>DRDO (Defence Research and Development Organisation)</strong></div>
            <div>Department: <strong>Department of Defence Production / iDEX</strong></div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
            The ambient atmospheric condition affects the temperature inside shelters and makes thermal management critical for maintaining habitable comfort. High altitude cold regions like Ladakh possess high annual solar irradiation (1900–2100 kWh/m²/year) and 300+ cloud-free days, but encounter severe temperature plunges after sunset (-15°C to -25°C). High thermal losses through envelope materials and openings demand external fossil fuel heating unless bioclimatically designed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-white">
              Primary Objective &amp; Scope
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Design a bioclimatic digital twin capable of predicting inside shelter temperatures, passive solar heat gain, and conductive/infiltration heat flow details for user-defined geographic inputs, followed by parametric comparison across Material, Size, Shape, and Orientation to minimize fossil fuel heating dependency.
            </p>
          </div>

          <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-white">
              Multi-Parametric Optimization
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evaluates combinations across Shapes (Rectangular, Cylindrical, Dome, A-Frame), Sizes (4x3m, 6x4m, 8x5m, 10x5m), Materials (Adobe, Stone, Brick, Concrete, Aerogel), and Orientations (0° to 360° azimuths) under identical ambient weather conditions to discover the globally optimal design.
            </p>
          </div>

          <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-white">
              ANSYS FEA Integration
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provides direct export of ANSYS Mechanical APDL (.inp) scripts, Workbench Python (.py) automation, and 24h tabular boundary condition CSV files to cross-validate 3D spatial buoyancy stratification, corner thermal bridging, and multi-layer temperature gradients.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 space-y-2">
        <div className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded inline-block">
          ENGINEERING TRANSPARENCY &amp; BOUNDARY CONDITIONS
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Assumptions, Thermal Comfort Criteria &amp; Model Limitations
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          The ShelterX platform integrates a sub-second transient lumped-capacitance nodal model for rapid design-space exploration with a high-fidelity ANSYS Mechanical FEA validation bridge. Explicit physical justifications ensure technical credibility for DRDO deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thermal Comfort Justification */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">
            Thermal Comfort Criteria Justification (Requirement #12)
          </h2>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <strong className="text-cyan-300 block mb-1">1. DRDO High-Altitude Survival Baseline (Tin ≥ +5°C):</strong>
              Under severe sub-zero Himalayan conditions (exterior temperatures dropping to -15°C to -25°C), maintaining indoor temperatures at or above +5°C without external heating prevents hypothermia, frostbite, and water supply freezing. This represents the primary feasibility constraint for standalone passive unheated shelters.
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <strong className="text-emerald-400 block mb-1">2. Operational Readiness Baseline (Tin ≥ 10°C):</strong>
              Permits wakeful tasks, communication equipment operation, and maintenance activities by troops wearing standard cold-weather military gear (ECWCS clo rating ~2.5–3.0) without shivering or cold fatigue.
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <strong className="text-amber-300 block mb-1">3. ASHRAE Standard 55 / ISO 7730 Adaptive Comfort (18°C–22°C):</strong>
              Full civilian and barracks residential comfort target. In high-altitude cold deserts, reaching this band in pure passive mode requires combined high thermal mass + aerogel composite insulation + Phase Change Material latent heat buffering.
            </div>
          </div>
        </div>

        {/* Physical Constants & Equations */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">
            Documented Physical Constants &amp; Convection Laws
          </h2>
          <div className="space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Air Infiltration Rate (ACH)</span>
              <span className="text-cyan-300">{config.simulation.ach} h⁻¹ (Adjustable in Expert Mode)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Reference Sea-Level Air Density (ρ_air)</span>
              <span className="text-white">1.225 kg/m³</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Air Specific Heat Capacity (Cp_air)</span>
              <span className="text-white">1005 J/(kg·K)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Interior Natural Convection (h_in)</span>
              <span className="text-white">{config.simulation.insideConvectionH} W/(m²·K)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Exterior Wind Convection (h_out)</span>
              <span className="text-white">h_out = 5.7 + 3.8 · V_wind (McAdams Correlation)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Sub-Slab Ground Boundary Temp</span>
              <span className="text-white">{config.simulation.groundTemperature}°C</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-sans">Simulation Timestep (Δt)</span>
              <span className="text-white">3,600 seconds (1 Hour per numerical step)</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-800">
            <strong>Lumped Model Limitations:</strong> The fast Python engine models the indoor air as a single well-mixed nodal volume. To analyze 3D buoyancy airflow plumes, natural ventilation stratification, or localized corner thermal bridges, export the provided APDL (.inp) script into ANSYS Mechanical Transient Thermal.
          </div>
        </div>
      </div>
    </div>
  );
};
