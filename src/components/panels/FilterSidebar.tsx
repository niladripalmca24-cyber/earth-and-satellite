import React, { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  Radio, 
  Eye, 
  RotateCcw,
  Sparkles,
  Palette
} from 'lucide-react';
import { FilterOptions, OrbitRegime, MissionCategory, ObjectStatus, ColorGradeMode } from '../../types/satellite';
import { audio } from '../../services/audioService';

interface FilterSidebarProps {
  filters: FilterOptions;
  onChangeFilters: (filters: FilterOptions) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  totalSatellites: number;
  filteredCount: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChangeFilters,
  isOpen,
  onToggleOpen,
  totalSatellites,
  filteredCount
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'layers'>('filter');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, search: e.target.value });
  };

  const toggleRegime = (regime: OrbitRegime) => {
    audio.playHover();
    const exists = filters.regimes.includes(regime);
    const updated = exists 
      ? filters.regimes.filter(r => r !== regime)
      : [...filters.regimes, regime];
    onChangeFilters({ ...filters, regimes: updated });
  };

  const toggleStatus = (status: ObjectStatus) => {
    audio.playHover();
    const exists = filters.statuses.includes(status);
    const updated = exists 
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onChangeFilters({ ...filters, statuses: updated });
  };

  const toggleCategory = (cat: MissionCategory) => {
    audio.playHover();
    const exists = filters.categories.includes(cat);
    const updated = exists 
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onChangeFilters({ ...filters, categories: updated });
  };

  const setConstellation = (c: string) => {
    audio.playHover();
    onChangeFilters({ ...filters, constellation: filters.constellation === c ? '' : c });
  };

  const handleResetFilters = () => {
    audio.playSelect();
    onChangeFilters({
      ...filters,
      search: '',
      regimes: [],
      categories: [],
      statuses: [],
      constellation: '',
      country: ''
    });
  };

  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="absolute left-2.5 sm:left-4 top-16 sm:top-20 z-20 glass-panel px-2.5 py-2 sm:p-2.5 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all flex items-center gap-1.5 sm:gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer"
          title="Open Filters Drawer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="font-display text-xs tracking-wider">FILTERS</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Drawer */}
      <aside
        className={`absolute top-14 sm:top-16 left-2 sm:left-4 bottom-20 sm:bottom-24 w-auto sm:w-80 right-2 sm:right-auto max-w-[calc(100vw-1rem)] z-20 glass-panel flex flex-col transition-all duration-300 shadow-2xl ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[115%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-bold text-xs tracking-wider text-white uppercase">
              ORBITAL FILTERS & LAYERS
            </h2>
          </div>
          <button
            onClick={onToggleOpen}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
            title="Hide Filters"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 gap-1 bg-black/30 border-b border-cyan-500/10 text-xs font-display">
          <button
            onClick={() => setActiveTab('filter')}
            className={`py-1.5 rounded text-center transition-all cursor-pointer ${
              activeTab === 'filter'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SATELLITE FILTERS
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`py-1.5 rounded text-center transition-all cursor-pointer ${
              activeTab === 'layers'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            DATA LAYERS
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5 no-scrollbar touch-scroll">
          {activeTab === 'filter' ? (
            <>
              {/* Search Box */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase">
                  Search by Name / ID / Operator
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400/60 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="e.g. Starlink, ISS, GPS, CZ-3C..."
                    className="w-full bg-slate-950/80 border border-cyan-500/30 rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                  {filters.search && (
                    <button
                      onClick={() => onChangeFilters({ ...filters, search: '' })}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Orbit Regime Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    Orbit Regime
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {filters.regimes.length === 0 ? 'ALL REGIMES' : `${filters.regimes.length} SELECTED`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-display">
                  {(['LEO', 'MEO', 'GEO', 'HEO'] as OrbitRegime[]).map(regime => {
                    const active = filters.regimes.includes(regime);
                    return (
                      <button
                        key={regime}
                        onClick={() => toggleRegime(regime)}
                        className={`py-1.5 px-3 rounded border text-left flex items-center justify-between transition-all ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{regime}</span>
                        <span className="text-[10px] font-mono opacity-60">
                          {regime === 'LEO' && '<2,000km'}
                          {regime === 'MEO' && '20,000km'}
                          {regime === 'GEO' && '35,786km'}
                          {regime === 'HEO' && 'Elliptic'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Object Type & Status (Privateer Legend Style) */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase">
                  Object Status & Classification
                </label>
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    { status: 'ACTIVE' as ObjectStatus, label: 'Active Satellite', color: '#00f0ff' },
                    { status: 'INACTIVE' as ObjectStatus, label: 'Inactive Satellite', color: '#64748b' },
                    { status: 'DEBRIS' as ObjectStatus, label: 'Debris & Rocket Body', color: '#ef4444' },
                  ].map(item => {
                    const active = filters.statuses.includes(item.status);
                    return (
                      <div
                        key={item.status}
                        onClick={() => toggleStatus(item.status)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                          active ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className={active ? 'text-white' : 'text-slate-400'}>
                            {item.label}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => {}}
                          className="accent-cyan-400 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Constellation Quick Filters */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase">
                  Constellations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Starlink', 'OneWeb', 'GPS', 'Galileo', 'GLONASS', 'BeiDou', 'Iridium', 'PlanetScope'].map(name => {
                    const active = filters.constellation === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setConstellation(name)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-full border transition-all ${
                          active
                            ? 'bg-cyan-400 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                            : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-cyan-500/40'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mission Categories */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase">
                  Mission Domain
                </label>
                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  {(['COMMUNICATION', 'NAVIGATION', 'EARTH_OBSERVATION', 'WEATHER', 'SCIENCE', 'SPACE_STATION', 'SURVEILLANCE'] as MissionCategory[]).map(cat => {
                    const active = filters.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded border transition-all ${
                          active
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* DATA LAYERS TAB */
            <div className="space-y-4 text-xs font-mono">
              <div className="text-slate-400 text-[11px] leading-relaxed">
                Toggle independent visualization layers in the 3D scene:
              </div>

              {[
                { key: 'showOrbits', label: '3D Orbit Trajectories', desc: 'Closed Keplerian orbital curves' },
                { key: 'showGroundTracks', label: 'Ground Tracks', desc: 'Sub-satellite surface path' },
                { key: 'showFootprints', label: 'Sensor Coverage Cones', desc: 'Geodesic field-of-view footprint' },
                { key: 'showGroundStations', label: 'Ground Stations (DSN)', desc: 'Deep Space Network tracking stations' },
                { key: 'showCommsLinks', label: 'Active Comms Telemetry Links', desc: 'Live laser/radio contact lines' },
                { key: 'showClouds', label: 'Atmospheric Cloud Layer', desc: 'High-altitude rotating storm clouds' },
              ].map(layer => {
                const checked = filters[layer.key as keyof FilterOptions] as boolean;
                return (
                  <div
                    key={layer.key}
                    onClick={() => {
                      audio.playHover();
                      onChangeFilters({
                        ...filters,
                        [layer.key]: !checked
                      });
                    }}
                    className="p-2.5 rounded bg-slate-950/60 border border-slate-800 hover:border-cyan-500/30 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-display text-white text-xs">{layer.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{layer.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="accent-cyan-400 pointer-events-none"
                    />
                  </div>
                );
              })}

              {/* Color Grading Profile Selector */}
              <div className="pt-2 border-t border-cyan-500/20">
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Color Grading Profile</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                  {[
                    { id: 'ACES_FILMIC' as ColorGradeMode, label: 'ACES Filmic (HDR Reference)', color: '#00f0ff' },
                    { id: 'DEEP_SPACE' as ColorGradeMode, label: 'Deep Space Cinema (Interstellar)', color: '#3b82f6' },
                    { id: 'INFRARED_RECON' as ColorGradeMode, label: 'Infrared Recon (FLIR False-Color)', color: '#f59e0b' },
                    { id: 'ORBITAL_DAWN' as ColorGradeMode, label: 'Orbital Dawn (Golden Hour)', color: '#fb923c' },
                    { id: 'CYBERPUNK' as ColorGradeMode, label: 'Cyberpunk Matrix (Neon)', color: '#d946ef' },
                  ].map(item => {
                    const active = (filters.colorGrade || 'ACES_FILMIC') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          audio.playSelect();
                          onChangeFilters({ ...filters, colorGrade: item.id });
                        }}
                        className={`p-2 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span>{item.label}</span>
                        </div>
                        {active && <span className="text-[10px] text-cyan-400">ACTIVE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-black/40 flex items-center justify-between">
          <button
            onClick={handleResetFilters}
            className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          <div className="text-xs font-mono text-cyan-400">
            {filteredCount} / {totalSatellites} Showing
          </div>
        </div>
      </aside>
    </>
  );
};
