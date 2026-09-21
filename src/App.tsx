import React, { useState, useMemo, useEffect } from 'react';
import { SATELLITE_CATALOG, GROUND_STATIONS } from './data/satellitesCatalog';
import { 
  SatelliteData, 
  FilterOptions, 
  TimeState, 
  ViewMode 
} from './types/satellite';
import { audio } from './services/audioService';
import { EarthCanvas } from './components/globe/EarthCanvas';
import { Map2DView } from './components/map2d/Map2DView';
import { CinematicLanding } from './components/landing/CinematicLanding';
import { TopNavHUD } from './components/hud/TopNavHUD';
import { FilterSidebar } from './components/panels/FilterSidebar';
import { SatelliteInfoPanel } from './components/panels/SatelliteInfoPanel';
import { SatelliteDetailModal } from './components/panels/SatelliteDetailModal';
import { CompareDrawer } from './components/panels/CompareDrawer';
import { WatchlistDrawer } from './components/panels/WatchlistDrawer';
import { DataProvenanceModal } from './components/panels/DataProvenanceModal';
import { TimelineController } from './components/timeline/TimelineController';
import { LiveEarthFeedModal } from './components/hud/LiveEarthFeedModal';

export function App() {
  // Cinematic vs Interactive state
  const [isCinematic, setIsCinematic] = useState(true);

  // 3D Globe vs 2D Map projection
  const [viewMode, setViewMode] = useState<ViewMode>('3D');

  // Selected Satellite for side drawer
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  // Camera Follow Mode state
  const [isFollowMode, setIsFollowMode] = useState(false);

  // Deep Dive modal state
  const [deepDiveSatellite, setDeepDiveSatellite] = useState<SatelliteData | null>(null);

  // Drawer / Modal visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [isLiveFeedMini, setIsLiveFeedMini] = useState(false);

  // Watchlist IDs
  const [watchlistIds, setWatchlistIds] = useState<string[]>(['25544', '20580', '48274']); // ISS, Hubble, Tiangong by default

  // Comparison satellite IDs (max 3)
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Simulation Time Engine State
  const [timeState, setTimeState] = useState<TimeState>({
    currentSimTime: new Date(),
    isPlaying: true,
    speedMultiplier: 1,
    isRealTime: true,
  });

  // Auto-accept and authorize all permissions on initial load
  useEffect(() => {
    audio.acceptAllPermissions();
  }, []);

  // Focus region state (e.g. 'INDIA' or 'GLOBAL')
  const [focusRegion, setFocusRegion] = useState<'INDIA' | 'GLOBAL' | null>('INDIA');

  // Global Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    regimes: [],
    categories: [],
    statuses: [],
    constellation: '',
    country: '',
    showOrbits: true,
    showGroundTracks: true,
    showFootprints: true,
    showGroundStations: true,
    showCommsLinks: true,
    showClouds: true,
    showNightLights: true,
    showAtmosphere: true,
    colorGrade: 'ACES_FILMIC',
    earthBrightness: 1.45,
  });

  // Filtered Satellites Count
  const filteredSatellites = useMemo(() => {
    return SATELLITE_CATALOG.filter(sat => {
      if (filters.regimes.length > 0 && !filters.regimes.includes(sat.regime)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(sat.status)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(sat.category)) return false;
      if (filters.constellation && sat.constellation !== filters.constellation) return false;
      if (filters.country && sat.country !== filters.country) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const mName = sat.name.toLowerCase().includes(q);
        const mId = sat.id.includes(q);
        const mOp = sat.operator.toLowerCase().includes(q);
        if (!mName && !mId && !mOp) return false;
      }
      return true;
    });
  }, [filters]);

  // Watchlisted satellites array
  const watchlistedSatellites = useMemo(() => {
    return SATELLITE_CATALOG.filter(s => watchlistIds.includes(s.id));
  }, [watchlistIds]);

  // Comparison satellites array
  const comparedSatellites = useMemo(() => {
    return SATELLITE_CATALOG.filter(s => compareIds.includes(s.id));
  }, [compareIds]);

  // Handlers
  const handleSelectMission = (key: string) => {
    if (key === 'ISS') {
      const iss = SATELLITE_CATALOG.find(s => s.id === '25544');
      if (iss) setSelectedSatellite(iss);
    } else if (key === 'HUBBLE') {
      const sat = SATELLITE_CATALOG.find(s => s.id === '20580');
      if (sat) setSelectedSatellite(sat);
    } else if (key === 'TIANGONG') {
      const tg = SATELLITE_CATALOG.find(s => s.id === '48274');
      if (tg) setSelectedSatellite(tg);
    } else if (key === 'STARLINK') {
      const st = SATELLITE_CATALOG.find(s => s.constellation === 'Starlink');
      if (st) setSelectedSatellite(st);
    } else if (key === 'GPS') {
      const gps = SATELLITE_CATALOG.find(s => s.category === 'NAVIGATION');
      if (gps) setSelectedSatellite(gps);
    } else if (key === 'SWOT') {
      const swot = SATELLITE_CATALOG.find(s => s.id === '54754');
      if (swot) setSelectedSatellite(swot);
    } else if (key === 'CHANDRA') {
      const chandra = SATELLITE_CATALOG.find(s => s.id === '25867');
      if (chandra) setSelectedSatellite(chandra);
    } else if (key === 'INSAT' || key === 'ISRO') {
      const insat = SATELLITE_CATALOG.find(s => s.id === '58988' || s.name.includes('INSAT-3DS'));
      if (insat) setSelectedSatellite(insat);
      setFocusRegion('INDIA');
    } else if (key === 'VANGUARD') {
      const vg = SATELLITE_CATALOG.find(s => s.id === '00005');
      if (vg) setSelectedSatellite(vg);
    }
  };

  const handleSelectSatellite = (sat: SatelliteData | null) => {
    setSelectedSatellite(sat);
    setIsFollowMode(false);
    if (sat && window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
  };

  const handleToggleFilters = () => {
    const nextState = !isFilterOpen;
    setIsFilterOpen(nextState);
    if (nextState && window.innerWidth < 768) {
      setSelectedSatellite(null);
    }
  };

  const handleEnterExperience = () => {
    setIsCinematic(false);
    audio.playEnterExperience();
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsFilterOpen(false);
    } else {
      setIsFilterOpen(true);
    }
    if (!selectedSatellite) {
      const insat = SATELLITE_CATALOG.find(s => s.name.includes('INSAT-3DS')) || SATELLITE_CATALOG.find(s => s.id === '25544');
      if (insat) setSelectedSatellite(insat);
    }
  };

  const handleToggleWatchlist = (sat: SatelliteData) => {
    audio.playHover();
    setWatchlistIds(prev => {
      if (prev.includes(sat.id)) {
        return prev.filter(id => id !== sat.id);
      } else {
        return [...prev, sat.id];
      }
    });
  };

  const handleToggleCompare = (sat: SatelliteData) => {
    audio.playSelect();
    setCompareIds(prev => {
      if (prev.includes(sat.id)) {
        return prev.filter(id => id !== sat.id);
      } else {
        if (prev.length >= 3) return [...prev.slice(1), sat.id];
        return [...prev, sat.id];
      }
    });
    setIsCompareOpen(true);
  };

  const handleResetCamera = () => {
    setIsFollowMode(false);
    setSelectedSatellite(null);
    setFocusRegion('INDIA');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Scanline CRT overlay for aerospace terminal effect */}
      <div className="scanline-overlay" />

      {/* 3D WebGL Globe View */}
      {viewMode === '3D' && (
        <EarthCanvas
          satellites={filteredSatellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={handleSelectSatellite}
          filters={filters}
          timeState={timeState}
          groundStations={GROUND_STATIONS}
          followMode={isFollowMode}
          onToggleFollowMode={() => setIsFollowMode(!isFollowMode)}
          isCinematic={isCinematic}
          onEnterExperience={handleEnterExperience}
          comparisonSatellites={comparedSatellites}
          focusRegion={focusRegion}
          onClearFocusRegion={() => setFocusRegion(null)}
        />
      )}

      {/* 2D Equirectangular Map View */}
      {viewMode === '2D' && !isCinematic && (
        <Map2DView
          satellites={filteredSatellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={handleSelectSatellite}
          filters={filters}
          timeState={timeState}
          groundStations={GROUND_STATIONS}
        />
      )}

      {/* Cinematic Landing Overlay */}
      {isCinematic && (
        <CinematicLanding
          onEnter={handleEnterExperience}
          onSelectMission={handleSelectMission}
          satelliteCount={SATELLITE_CATALOG.length}
        />
      )}

      {/* Interactive Explorer UI Elements (Visible when not in cinematic) */}
      {!isCinematic && (
        <>
          {/* Top Mission HUD */}
          <TopNavHUD
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            timeState={timeState}
            satelliteCount={filteredSatellites.length}
            watchlistCount={watchlistIds.length}
            comparisonCount={compareIds.length}
            onOpenWatchlist={() => setIsWatchlistOpen(true)}
            onOpenCompare={() => setIsCompareOpen(true)}
            onOpenProvenance={() => setIsProvenanceOpen(true)}
            onResetView={handleResetCamera}
            onReplayCinematic={() => setIsCinematic(true)}
            colorGrade={filters.colorGrade}
            onChangeColorGrade={(grade) => setFilters(prev => ({ ...prev, colorGrade: grade }))}
            permissionsGranted={true}
            earthBrightness={filters.earthBrightness ?? 1.45}
            onChangeEarthBrightness={(b) => setFilters(prev => ({ ...prev, earthBrightness: b }))}
            onFocusIndia={() => setFocusRegion('INDIA')}
            onSelectMission={handleSelectMission}
            onOpenLiveEarthFeed={() => {
              setIsLiveFeedOpen(true);
              setIsLiveFeedMini(false);
            }}
          />

          {/* Left Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onChangeFilters={setFilters}
            isOpen={isFilterOpen}
            onToggleOpen={handleToggleFilters}
            totalSatellites={SATELLITE_CATALOG.length}
            filteredCount={filteredSatellites.length}
          />

          {/* Right Satellite Telemetry Side Panel */}
          <SatelliteInfoPanel
            satellite={selectedSatellite}
            onClose={() => {
              setSelectedSatellite(null);
              setIsFollowMode(false);
            }}
            timeState={timeState}
            groundStations={GROUND_STATIONS}
            isFollowMode={isFollowMode}
            onToggleFollow={() => setIsFollowMode(!isFollowMode)}
            isWatchlisted={selectedSatellite ? watchlistIds.includes(selectedSatellite.id) : false}
            onToggleWatchlist={handleToggleWatchlist}
            isCompared={selectedSatellite ? compareIds.includes(selectedSatellite.id) : false}
            onToggleCompare={handleToggleCompare}
            onOpenDeepDive={(sat) => setDeepDiveSatellite(sat)}
          />

          {/* Bottom Timeline & Time Machine Controller */}
          <TimelineController
            timeState={timeState}
            onChangeTimeState={setTimeState}
          />

          {/* Satellite Deep Dive Inspection Modal */}
          {deepDiveSatellite && (
            <SatelliteDetailModal
              satellite={deepDiveSatellite}
              onClose={() => setDeepDiveSatellite(null)}
              timeState={timeState}
            />
          )}

          {/* Compare Satellites Drawer */}
          {isCompareOpen && (
            <CompareDrawer
              satellites={comparedSatellites}
              onRemoveSatellite={(id) => setCompareIds(prev => prev.filter(i => i !== id))}
              onClearAll={() => setCompareIds([])}
              onClose={() => setIsCompareOpen(false)}
              onSelectSatellite={(sat) => {
                handleSelectSatellite(sat);
                setIsCompareOpen(false);
              }}
              timeState={timeState}
            />
          )}

          {/* Watchlist Drawer */}
          {isWatchlistOpen && (
            <WatchlistDrawer
              satellites={watchlistedSatellites}
              onRemoveSatellite={(id) => setWatchlistIds(prev => prev.filter(i => i !== id))}
              onClearAll={() => setWatchlistIds([])}
              onClose={() => setIsWatchlistOpen(false)}
              onSelectSatellite={(sat) => {
                handleSelectSatellite(sat);
                setIsWatchlistOpen(false);
              }}
              timeState={timeState}
            />
          )}

          {/* Scientific Data Provenance Modal */}
          <DataProvenanceModal
            isOpen={isProvenanceOpen}
            onClose={() => setIsProvenanceOpen(false)}
          />

          {/* Real-Life Live Earth Video & Operational Satellite Feed Modal */}
          <LiveEarthFeedModal
            isOpen={isLiveFeedOpen}
            onClose={() => {
              setIsLiveFeedOpen(false);
              setIsLiveFeedMini(false);
            }}
            isMiniMode={isLiveFeedMini}
            onToggleMiniMode={() => setIsLiveFeedMini(!isLiveFeedMini)}
          />
        </>
      )}
    </div>
  );
}

export default App;
