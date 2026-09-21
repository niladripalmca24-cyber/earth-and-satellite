import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Volume2, 
  VolumeX,
  Radio,
  Info,
  Globe2,
  Layers
} from 'lucide-react';
import { audio } from '../../services/audioService';

interface CinematicLandingProps {
  onEnter: () => void;
  onSelectMission?: (missionKey: string) => void;
  satelliteCount: number;
}

export const CinematicLanding: React.FC<CinematicLandingProps> = ({
  onEnter,
  onSelectMission,
  satelliteCount
}) => {
  const [isMuted, setIsMuted] = useState(audio.getMuted());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'about' | 'regimes' | null>(null);
  const [selectedRegimeIdx, setSelectedRegimeIdx] = useState(0);

  const regimes = ['ALL', 'LEO', 'MEO', 'GEO', 'DEBRIS'];

  const featuredSatellites = [
    { id: '01', name: 'International Space Station', key: 'ISS', sub: '420 km LEO · Crewed Station' },
    { id: '02', name: 'Hubble Space Telescope', key: 'HUBBLE', sub: '535 km LEO · Optical Astronomy' },
    { id: '03', name: 'Tiangong Space Station', key: 'TIANGONG', sub: '385 km LEO · Modular Station' },
    { id: '04', name: 'Starlink Constellation', key: 'STARLINK', sub: '550 km LEO · Global Mesh' },
  ];

  const handleLaunchClick = (missionKey: string) => {
    audio.playEnterExperience();
    if (onSelectMission) {
      onSelectMission(missionKey);
    }
    onEnter();
  };

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) audio.playHover();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      
      {/* BACKGROUND FAINT OUTER HEADER (Mirrors reference image double-viewport depth) */}
      <div className="absolute top-3 sm:top-5 left-0 right-0 px-8 sm:px-12 flex items-center justify-between opacity-25 pointer-events-none select-none z-10">
        <div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center text-white text-xs font-hero">
          α
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-sans tracking-widest text-slate-400 uppercase">
          <span>Satellites</span>
          <span>Constellations</span>
          <span>Orbital Telemetry</span>
          <span>Coverage</span>
        </div>
        <div className="flex items-center gap-3 text-white">
          <Search className="w-3.5 h-3.5" />
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* GIANT FAINT WATERMARK BEHIND/ABOVE THE EARTH */}
      <div className="absolute top-2 sm:top-6 left-1/2 -translate-x-1/2 text-[3.8rem] sm:text-[6.5rem] md:text-[8.5rem] lg:text-[10.5rem] font-hero font-extrabold text-white/[0.045] whitespace-nowrap tracking-wider select-none pointer-events-none uppercase">
        EARTH ORBIT
      </div>

      {/* MAIN AEROSPACE SHOWCASE CONTAINER (Sleek Glassmorphic Floating Card) */}
      <div className="relative w-full max-w-[1260px] h-full max-h-[88vh] min-h-[580px] rounded-[28px] sm:rounded-[36px] border border-white/[0.12] shadow-[0_25px_90px_rgba(0,0,0,0.92)] flex flex-col justify-between overflow-hidden pointer-events-auto bg-gradient-to-b from-[#0e131d]/75 via-[#0a0e17]/15 to-[#080b12]/85">
        
        {/* TOP NAVIGATION BAR */}
        <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between border-b border-white/[0.06] z-20">
          {/* Aerospace Stylized Monogram Logo */}
          <div 
            onClick={() => {
              audio.playHover();
              onEnter();
            }}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title="EarthOrbit 3D Platform"
          >
            <svg 
              viewBox="0 0 32 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-7 h-7 text-white group-hover:text-cyan-400 transition-colors"
            >
              <path 
                d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 12 23 9 19 9C15 9 13 12 13 16C13 18.5 14.5 20 17 20C19.5 20 21 18.5 21 16" 
                stroke="currentColor" 
                strokeWidth="2.8" 
                strokeLinecap="round"
              />
            </svg>
            <span className="font-hero font-bold text-xs tracking-widest text-white hidden sm:inline">
              EARTHORBIT 3D
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-[13px] font-sans font-normal tracking-wide text-slate-300 select-none">
            <button 
              onClick={() => {
                audio.playHover();
                onEnter();
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Satellites
            </button>
            <button 
              onClick={() => {
                audio.playHover();
                setActiveModal('regimes');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Orbital Regimes
            </button>
            <button 
              onClick={() => {
                audio.playHover();
                handleLaunchClick('ISS');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Space Stations
            </button>
            <button 
              onClick={() => {
                audio.playHover();
                setActiveModal('about');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About Platform
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4 text-slate-300">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Enable Sound FX' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Quick Search */}
            <button 
              onClick={() => {
                audio.playHover();
                setIsSearchOpen(!isSearchOpen);
              }}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Search Missions & Satellites"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Platform Info Modal */}
            <button 
              onClick={() => {
                audio.playHover();
                setActiveModal('about');
              }}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="About EarthOrbit 3D"
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        {/* SEARCH OVERLAY */}
        {isSearchOpen && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 w-full max-w-md z-40 p-3 rounded-xl bg-black/90 border border-white/20 shadow-2xl backdrop-blur-md animate-in fade-in">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search ISS, Hubble, Starlink, GPS, Debris..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onEnter();
                  }
                }}
                className="w-full bg-transparent border border-white/15 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CENTER HERO TYPOGRAPHY OVERLAY */}
        <div className="absolute top-[12%] sm:top-[14%] left-1/2 -translate-x-1/2 w-full max-w-3xl text-center px-4 z-10 pointer-events-none select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-hero font-extrabold text-white tracking-tight uppercase leading-[0.92] drop-shadow-[0_12px_36px_rgba(0,0,0,0.95)]">
            EXPLORE EARTH <br />
            TRACK SPACE
          </h1>
        </div>

        {/* MIDDLE CONTENT COLUMNS (FLANKING THE 3D EARTH) */}
        <div className="relative flex-1 flex flex-col md:flex-row items-end md:items-center justify-between px-6 sm:px-10 lg:px-14 py-2 gap-6 z-10">
          
          {/* LEFT COLUMN: FEATURED SATELLITES */}
          <div className="w-full md:w-80 space-y-2 select-none">
            <div className="text-[11px] font-hero font-bold text-white tracking-widest uppercase mb-1">
              FEATURED SATELLITES
            </div>

            <div className="divide-y divide-white/10 border-t border-b border-white/10">
              {featuredSatellites.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleLaunchClick(item.key)}
                  onMouseEnter={() => audio.playHover()}
                  className="py-3.5 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                      {item.id}
                    </span>
                    <div>
                      <div className="text-xs sm:text-[13px] font-medium tracking-wide">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  
                  {/* Slanted Arrow ↗ */}
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE ORBIT TELEMETRY SPOTLIGHT */}
          <div className="w-full md:w-80 flex flex-col items-start md:items-end select-none">
            <div className="text-[11px] font-hero font-bold text-white tracking-widest uppercase mb-3 text-left md:text-right w-full">
              LIVE TELEMETRY <br />
              SPOTLIGHT
            </div>

            {/* Telemetry Spotlight Card */}
            <div 
              onClick={() => handleLaunchClick('ISS')}
              className="w-full max-w-[280px] rounded-2xl bg-black/60 border border-white/15 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-sm cursor-pointer group hover:border-white/30 transition-all select-none"
              title="Click to track in 3D"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <div>
                  <div className="font-hero font-bold text-xs text-white">ISS (ZARYA)</div>
                  <div className="text-[10px] font-mono text-cyan-400">NORAD ID: 25544</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Regime</span>
                  <span className="text-white font-sans font-medium">Low Earth Orbit</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Velocity</span>
                  <span className="text-white">7.66 km/s (27,576 km/h)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Altitude</span>
                  <span className="text-white">418.2 km</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Inclination</span>
                  <span className="text-white">51.64°</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Period</span>
                  <span className="text-white">92.88 min</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-cyan-400 font-sans group-hover:text-white transition-colors">
                <span className="font-medium text-[11px]">Lock Camera in 3D</span>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                >
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS & CHUNKY NOTCHED BUTTON */}
        <div className="w-full px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between border-t border-white/[0.06] z-20">
          
          {/* Bottom Left: Chunky Notched Arrow Button matching reference image */}
          <div className="flex items-center gap-3 select-none">
            <button
              onClick={() => {
                audio.playEnterExperience();
                onEnter();
              }}
              onMouseEnter={() => audio.playHover()}
              className="w-13 h-13 sm:w-16 sm:h-16 bg-black border-2 border-white/30 hover:border-white rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(255,255,255,0.35)] transition-all duration-300 cursor-pointer group"
              title="Enter Interactive 3D Orbit Explorer"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              >
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
            <div className="hidden sm:block">
              <div className="font-hero font-bold text-xs text-white tracking-wider">ENTER 3D EXPLORER</div>
              <div className="text-[10px] font-mono text-slate-400">Launch SGP4 Orbit Intelligence</div>
            </div>
          </div>

          {/* Bottom Center: Minimalist Regime Dash Indicators */}
          <div className="flex items-center gap-2 select-none">
            {regimes.map((reg, idx) => (
              <button
                key={reg}
                onClick={() => {
                  audio.playHover();
                  setSelectedRegimeIdx(idx);
                }}
                className={`h-[2.5px] rounded-full transition-all duration-300 cursor-pointer ${
                  selectedRegimeIdx === idx
                    ? 'w-8 bg-white shadow-sm' 
                    : 'w-3.5 bg-white/25 hover:bg-white/50'
                }`}
                title={`Filter: ${reg}`}
                aria-label={`Regime ${reg}`}
              />
            ))}
          </div>

          {/* Bottom Right: Live Satellite Telemetry Status */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wider">{satelliteCount} OBJECTS TRACKED</span>
          </div>
        </div>
      </div>

      {/* PLATFORM ABOUT & REGIMES MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in pointer-events-auto">
          <div className="relative w-full max-w-lg glass-panel p-6 border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-hero font-bold text-sm text-white uppercase">
                {activeModal === 'about' && 'About EarthOrbit 3D'}
                {activeModal === 'regimes' && 'Orbital Regimes Reference'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 font-sans leading-relaxed">
              {activeModal === 'about' && (
                <>
                  <p>
                    <strong className="text-white">EarthOrbit 3D</strong> is a high-fidelity interactive digital globe and space intelligence platform.
                  </p>
                  <p>
                    It calculates real-time satellite positions using the <span className="text-cyan-400 font-mono">SGP4 (Simplified General Perturbations-4)</span> analytical propagation model directly from official Two-Line Element sets (TLEs).
                  </p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5 font-mono text-[11px]">
                    <div>• Photorealistic NASA Blue Marble & Black Marble Textures</div>
                    <div>• Ocean Specular Sunlight Reflections</div>
                    <div>• Ground Station Deep Space Network (DSN) Telemetry Links</div>
                    <div>• Real-time Geodesic Sensor Coverage Footprints</div>
                  </div>
                </>
              )}

              {activeModal === 'regimes' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-white text-xs">Low Earth Orbit (LEO)</div>
                    <div className="text-[11px] text-slate-400">160 – 2,000 km · ISS, Tiangong, Hubble, Starlink, Earth Observation</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-white text-xs">Medium Earth Orbit (MEO)</div>
                    <div className="text-[11px] text-slate-400">2,000 – 35,786 km · GPS, Galileo, GLONASS Navigation Constellations</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-white text-xs">Geostationary Orbit (GEO)</div>
                    <div className="text-[11px] text-slate-400">35,786 km · 24-hour stationary period for weather and telecommunications</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  onEnter();
                }}
                className="px-4 py-2 rounded-lg bg-white text-black font-hero font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                LAUNCH 3D EXPLORER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

