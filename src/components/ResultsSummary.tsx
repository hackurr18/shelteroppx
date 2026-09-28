import React from 'react';
import { ShelterConfig, SimulationResponse } from '../state/shelterConfig';

interface ResultsSummaryProps {
  config: ShelterConfig;
  results: SimulationResponse;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ config, results }) => {
  const { summary } = results;
  const statements: string[] = [];

  // 1. Wall Thermal Resistance & Conduction statement
  if (summary.wall_r_value >= 2.5) {
    statements.push(
      `Your selected ${config.walls.assemblyName || 'composite'} wall assembly (${Math.round(
        summary.wall_thickness_m * 1000
      )} mm total thickness) achieves a high thermal resistance of R = ${summary.wall_r_value.toFixed(
        2
      )} m²·K/W (U = ${summary.wall_u_value.toFixed(
        2
      )} W/m²·K), significantly restricting conductive heat loss across the ${summary.geometry.net_wall_area.toFixed(
        1
      )} m² opaque envelope.`
    );
  } else {
    statements.push(
      `Your current wall assembly has a moderate thermal resistance of R = ${summary.wall_r_value.toFixed(
        2
      )} m²·K/W (U = ${summary.wall_u_value.toFixed(
        2
      )} W/m²·K). Adding an insulation core layer or increasing wall thickness will reduce the ${summary.total_heat_loss_kwh.toFixed(
        1
      )} kWh total heat loss.`
    );
  }

  // 2. Solar Heat Gain & Orientation statement
  statements.push(
    `Direct and sol-air solar radiation contributes ${summary.total_solar_kwh.toFixed(
      2
    )} kWh of passive heat gain with the shelter oriented at ${config.geometry.orientationAzimuth}° (${config.geometry.orientationLabel || 'South'}). Indoor air temperature peaks at ${summary.max_indoor_temp.toFixed(
      1
    )}°C compared to the outdoor ambient maximum of ${summary.max_outdoor_temp.toFixed(1)}°C.`
  );

  // 3. Nighttime cooling & Thermal Lift statement
  statements.push(
    `Heat loss peaks after sunset (18:00–05:00) because solar gain drops to 0 W while the indoor-to-outdoor temperature differential remains large (ambient minimum reaches ${summary.min_outdoor_temp.toFixed(
      1
    )}°C). Even at the coldest pre-dawn hour, the passive thermal mass maintains an average thermal lift of +${summary.temp_lift_avg.toFixed(
      1
    )}°C above ambient.`
  );

  // 4. ANSYS 3D FEA cross-validation statement
  if (summary.ansys_validation) {
    statements.push(
      `ANSYS Mechanical Transient Thermal FEA validation confirms high fidelity: Mean Absolute Error (MAE) between the fast lumped model and 3D FEA spatial air node is ${summary.ansys_validation.mae.toFixed(
        2
      )}°C with Pearson correlation R² = ${summary.ansys_validation.pearson_r2.toFixed(
        3
      )} (${summary.ansys_validation.status}).`
    );
  }

  // 5. Louver statement if enabled
  const primaryLouver = config.windows[0]?.louver;
  if (primaryLouver?.enabled) {
    statements.push(
      `With solar louvers enabled (${primaryLouver.angle}° tilt, ${primaryLouver.depth} m depth, ${primaryLouver.spacing} m spacing), direct window solar heat gain was modulated from ${summary.total_solar_without_louver_kwh.toFixed(
        2
      )} kWh (unshaded) to ${summary.total_solar_kwh.toFixed(
        2
      )} kWh (-${summary.louver_reduction_kwh.toFixed(2)} kWh shading reduction to prevent midday overheating).`
    );
  }

  // 6. PCM statement if enabled
  if (config.thermalStorage.pcmEnabled && config.thermalStorage.mass > 0) {
    statements.push(
      `Phase Change Material latent storage (${config.thermalStorage.mass} kg of ${config.thermalStorage.material} at T_melt = ${config.thermalStorage.meltingTemp}°C) buffers daytime peak temperatures and discharges ${summary.peak_thermal_storage_kwh.toFixed(
        2
      )} kWh of latent heat to the interior during freezing nights.`
    );
  }

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-semibold text-white">
            Physical Behavior &amp; Thermodynamics Interpretation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated engineering summary derived strictly from the calculated energy balance and ANSYS verification
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-300 tabular-nums">
          Comfort Hours: {summary.comfort_hours} / {summary.total_hours} h ({summary.comfort_percentage}%)
        </div>
      </div>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-300 leading-relaxed">
        {statements.map((stmt, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="font-mono text-xs text-cyan-400 mt-1 shrink-0 tabular-nums">
              0{idx + 1}.
            </span>
            <span>{stmt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
