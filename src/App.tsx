import React, { useState, useEffect, useMemo } from 'react';
import {
  ShelterConfig,
  MaterialItem,
  SavedDesign,
  OptimizationCandidate,
  INITIAL_MATERIALS,
  createDefaultShelterConfig
} from './state/shelterConfig';
import {
  executeTransientSimulationLocal,
  runSimulationAPI,
  calculateLiveEnvelopeMetrics,
  generateAnsysApdlScript
} from './services/api';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { DesignStudio } from './pages/DesignStudio';
import { Materials } from './pages/Materials';
import { Climate } from './pages/Climate';
import { Simulation } from './pages/Simulation';
import { Comparison } from './pages/Comparison';
import { Optimization } from './pages/Optimization';
import { AnsysValidation } from './pages/AnsysValidation';
import { AssumptionsPage } from './pages/AssumptionsModal';

export function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [ansysExportNotice, setAnsysExportNotice] = useState<string | null>(null);

  // ONE CENTRAL SHELTER CONFIGURATION STATE (Single Source of Truth)
  const [shelterConfig, setShelterConfig] = useState<ShelterConfig>(() =>
    createDefaultShelterConfig()
  );

  // Configurable reference material database
  const [materials, setMaterials] = useState<MaterialItem[]>(() => [
    ...INITIAL_MATERIALS
  ]);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Pre-populate Comparison slots A & B
  const [designA, setDesignA] = useState<SavedDesign | null>(() => {
    const base = createDefaultShelterConfig();
    return {
      id: 'design-a',
      label: 'Adobe Composite (400mm, South 180°)',
      timestamp: 'Baseline Demo',
      config: base
    };
  });

  const [designB, setDesignB] = useState<SavedDesign | null>(() => {
    const base = createDefaultShelterConfig();
    const altConfig: ShelterConfig = {
      ...base,
      geometry: {
        ...base.geometry,
        shape: 'dome',
        orientationAzimuth: 180,
        orientationLabel: 'South (180°)'
      },
      walls: {
        assemblyName: 'Stone Composite',
        layers: [
          { material: 'Stone', thickness: 0.15 },
          { material: 'Insulation', thickness: 0.10 },
          { material: 'Stone', thickness: 0.15 }
        ]
      },
      windows: base.windows.map((w) => ({
        ...w,
        orientationAzimuth: 180,
        orientationLabel: 'South'
      }))
    };
    return {
      id: 'design-b',
      label: 'Dome Stone Composite (400mm, South)',
      timestamp: 'Candidate Comparison',
      config: altConfig
    };
  });

  // Load materials from backend on startup if available
  useEffect(() => {
    fetch('/api/materials')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.materials && Array.isArray(data.materials) && data.materials.length > 0) {
          setMaterials(data.materials);
        }
      })
      .catch(() => {
        // Fallback to local default materials
      });
  }, []);

  // Live transient simulation derived from central shelterConfig & materials
  const simulationResults = useMemo(() => {
    return executeTransientSimulationLocal(shelterConfig, materials);
  }, [shelterConfig, materials]);

  const liveMetrics = useMemo(() => {
    return calculateLiveEnvelopeMetrics(shelterConfig, materials);
  }, [shelterConfig, materials]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      await runSimulationAPI(shelterConfig, materials);
    } finally {
      setIsSimulating(false);
      if (activePage === 'dashboard') {
        setActivePage('simulation');
      }
    }
  };

  const handleLoadDemo = () => {
    const demoCfg = createDefaultShelterConfig();
    setShelterConfig(demoCfg);
  };

  const handleCreateNewDesign = () => {
    const fresh = createDefaultShelterConfig();
    setShelterConfig(fresh);
    setActivePage('design');
  };

  const handleSaveDesignSlot = (
    slot: 'A' | 'B',
    customCfg?: ShelterConfig,
    customLabel?: string
  ) => {
    const targetCfg = customCfg || shelterConfig;
    const thicknessMm = Math.round(
      targetCfg.walls.layers.reduce((a, l) => a + l.thickness, 0) * 1000
    );
    const label =
      customLabel ||
      `${targetCfg.walls.assemblyName} (${thicknessMm}mm • ${targetCfg.geometry.shape} • ${targetCfg.geometry.orientationAzimuth}°)`;
    const saved: SavedDesign = {
      id: `design-${slot.toLowerCase()}-${Date.now()}`,
      label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      config: JSON.parse(JSON.stringify(targetCfg))
    };
    if (slot === 'A') {
      setDesignA(saved);
    } else {
      setDesignB(saved);
    }
  };

  const handleClearDesignSlot = (slot: 'A' | 'B') => {
    if (slot === 'A') setDesignA(null);
    else setDesignB(null);
  };

  const handleApplyOptimizationCandidate = (cand: OptimizationCandidate) => {
    setShelterConfig((prev) => ({
      ...prev,
      geometry: {
        ...prev.geometry,
        shape: cand.shape,
        length: cand.length,
        width: cand.width,
        height: cand.height,
        orientationAzimuth: cand.orientationAzimuth,
        orientationLabel: cand.orientationLabel
      },
      walls: {
        assemblyName: cand.assembly,
        layers: cand.layers.map((l) => ({ ...l }))
      },
      windows: [
        {
          id: 'win-opt',
          area: cand.windowArea,
          orientationAzimuth: cand.orientationAzimuth,
          orientationLabel: cand.orientationLabel,
          type: prev.windows[0]?.type || 'double_glazed',
          louver: prev.windows[0]?.louver || { enabled: false, angle: 30, depth: 0.2, spacing: 0.2 }
        }
      ]
    }));
  };

  const handleQuickExportAnsys = () => {
    const script = generateAnsysApdlScript(shelterConfig, materials, liveMetrics.totalThicknessM);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelterx_${shelterConfig.geometry.shape}_${shelterConfig.location.name.toLowerCase()}.inp`;
    a.click();
    URL.revokeObjectURL(url);
    setAnsysExportNotice('Downloaded ANSYS APDL Input (.inp)');
    setTimeout(() => setAnsysExportNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* Top 3-Zone Navigation Bar */}
      <Header
        activePage={activePage}
        onSelectPage={setActivePage}
        expertMode={expertMode}
        onToggleExpertMode={setExpertMode}
        onLoadDemo={handleLoadDemo}
        onRunSimulation={handleRunSimulation}
        onQuickExportAnsys={handleQuickExportAnsys}
        isSimulating={isSimulating}
        ansysExportNotice={ansysExportNotice}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          locationName={shelterConfig.location.name}
          wallThicknessMm={liveMetrics.totalThicknessMm}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            {activePage === 'dashboard' && (
              <Dashboard
                config={shelterConfig}
                materials={materials}
                simulationResults={simulationResults}
                onSelectPage={setActivePage}
                onCreateNewDesign={handleCreateNewDesign}
                onLoadDemo={handleLoadDemo}
                onRunSimulation={handleRunSimulation}
                onQuickExportAnsys={handleQuickExportAnsys}
              />
            )}

            {activePage === 'design' && (
              <DesignStudio
                config={shelterConfig}
                materials={materials}
                simulationResults={simulationResults}
                expertMode={expertMode}
                onChange={setShelterConfig}
                onRunSimulation={handleRunSimulation}
                onSaveForComparison={(slot) => handleSaveDesignSlot(slot)}
                onSelectPage={setActivePage}
              />
            )}

            {activePage === 'materials' && (
              <Materials
                materials={materials}
                config={shelterConfig}
                onUpdateMaterials={setMaterials}
                onUpdateConfig={setShelterConfig}
              />
            )}

            {activePage === 'climate' && (
              <Climate
                config={shelterConfig}
                onChange={setShelterConfig}
              />
            )}

            {activePage === 'simulation' && (
              <Simulation
                config={shelterConfig}
                materials={materials}
                results={simulationResults}
                onUpdateConfig={setShelterConfig}
                onRunSimulation={handleRunSimulation}
                onSaveForComparison={(slot) => handleSaveDesignSlot(slot)}
              />
            )}

            {activePage === 'comparison' && (
              <Comparison
                currentConfig={shelterConfig}
                materials={materials}
                designA={designA}
                designB={designB}
                onSaveDesignSlot={handleSaveDesignSlot}
                onClearDesignSlot={handleClearDesignSlot}
                onLoadConfigIntoStudio={(cfg) => {
                  setShelterConfig(JSON.parse(JSON.stringify(cfg)));
                  setActivePage('design');
                }}
              />
            )}

            {activePage === 'optimization' && (
              <Optimization
                config={shelterConfig}
                materials={materials}
                onApplyCandidate={handleApplyOptimizationCandidate}
                onSelectPage={setActivePage}
              />
            )}

            {activePage === 'ansys' && (
              <AnsysValidation
                config={shelterConfig}
                materials={materials}
                simulationResults={simulationResults}
              />
            )}

            {(activePage === 'assumptions' || activePage === 'project_info') && (
              <AssumptionsPage
                config={shelterConfig}
                mode={activePage}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
