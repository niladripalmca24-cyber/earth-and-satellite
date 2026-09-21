import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Map, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Bookmark, 
  Layers, 
  Info, 
  Activity,
  Maximize2,
  Palette,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { ViewMode, TimeState, ColorGradeMode } from '../../types/satellite';
import { audio } from '../../services/audioService';

interface TopNavHUDProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  timeState: TimeState;
  satelliteCount: number;
  watchlistCount: number;
  comparisonCount: number;
  onOpenWatchlist: () => void;
  onOpenCompare: () => void;
  onOpenProvenance: () => void;
  onResetView: () => void;
  onReplayCinematic: () => void;
  colorGrade: ColorGradeMode;
  onChangeColorGrade: (mode: ColorGradeMode) => void;
  permissionsGranted?: boolean;
  onOpenLiveEarthFeed: () => void;
}

const COLOR_GRADE_PRESETS: Array<{ id: ColorGradeMode; name: string; tag: string; color: string }> = [
  { id: 'ACES_FILMIC', name: 'ACES Filmic', tag: 'HDR Reference', color: '#00f0ff' },
  { id: 'DEEP_SPACE', name: 'Deep Space Cinema', tag: 'Interstellar', color: '#3b82f6' },
  { id: 'INFRARED_RECON', name: 'Infrared Recon', tag: 'FLIR Thermal', color: '#f59e0b' },
  { id: 'ORBITAL_DAWN', name: 'Orbital Dawn', tag: 'Golden Hour', color: '#fb923c' },
  { id: 'CYBERPUNK', name: 'Cyberpunk Matrix', tag: 'Neon Sci-Fi', color: '#d946ef' },
];

export const TopNavHUD: React.FC<TopNavHUDProps> = ({
  viewMode,
  onToggleViewMode,
  timeState,
  satelliteCount,
  watchlistCount,
  comparisonCount,
  onOpenWatchlist,
  onOpenCompare,
  onOpenProvenance,
  onResetView,
  onReplayCinematic,
  colorGrade,
  onChangeColorGrade,
  permissionsGranted = true,
  onOpenLiveEarthFeed
}) => {
  const [isMuted, setIsMuted] = useState(audio.getMuted());
  const [utcString, setUtcString] = useState('');
  const [julianDate, setJulianDate] = useState('');
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);
  const [showPermissionToast, setShowPermissionToast] = useState(false);

  // Update UTC and Julian date clock
  useEffect(() => {
    const updateClock = () => {
      const now = timeState.currentSimTime;
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcString(`${hours}:${minutes}:${seconds} UTC`);

      // Approximate Julian Date calculation
      const timeMs = now.getTime();
      const jd = (timeMs / 86400000) + 2440587.5;
      setJulianDate(`JD ${jd.toFixed(4)}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 100);
    return () => clearInterval(interval);
  }, [timeState.currentSimTime]);

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) audio.playHover();
  };

  const handlePermissionClick = () => {
    audio.playSelect();
    audio.acceptAllPermissions();
    setShowPermissionToast(true);
    setTimeout(() => setShowPermissionToast(false), 3500);
  };

  const currentPreset = COLOR_GRADE_PRESETS.find(p => p.id === colorGrade) || COLOR_GRADE_PRESETS[0];

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none px-3 sm:px-6 py-3 flex items-center justify-between font-ui">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
        <div 
          onClick={onReplayCinematic}
          className="glass-panel px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-3 cursor-pointer hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          title="Return to cinematic intro"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="font-hero font-extrabold text-xs sm:text-sm tracking-wider text-white">
              EARTHORBIT <span className="text-cyan-400">3D</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 tracking-wider">
              MISSION INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 glass-panel-subtle px-3 py-1.5 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">TRACKING:</span>
          <span className="text-emerald-400 font-bold">{satelliteCount} OBJECTS</span>
        </div>

        {/* All Permissions Accepted & Granted Badge */}
        <button
          onClick={handlePermissionClick}
          className="hidden xl:flex items-center gap-1.5 glass-panel-subtle px-2.5 py-1 text-[11px] font-mono border-emerald-500/30 text-emerald-300 hover:text-white transition-all cursor-pointer"
          title="All System Permissions & Accelerations Accepted"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PERMISSIONS GRANTED</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Center: Mission Chronometer */}
      <div className="pointer-events-auto flex items-center gap-3 glass-panel px-3 sm:px-4 py-1.5 sm:py-2 border-cyan-500/30">
        <div className="text-center">
          <div className="font-mono text-xs sm:text-base font-bold text-cyan-300 tracking-wider">
            {utcString}
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-slate-400">
            {julianDate} • {timeState.isRealTime ? 'REAL-TIME' : `${timeState.speedMultiplier}x SIM`}
          </div>
        </div>
      </div>

      {/* Right: Color Grading, Projection Switch & Tool Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Real-Life Live Earth Feed Button */}
        <button
          onClick={() => {
            audio.playSelect();
            onOpenLiveEarthFeed();
          }}
          className="glass-panel px-2.5 py-1.5 sm:px-3 text-xs font-mono flex items-center gap-2 border-rose-500/40 hover:border-rose-400 text-slate-200 transition-all cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          title="Open Real-Life Live Earth Video Streams & Satellite Feeds"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="hidden sm:inline font-display font-bold tracking-wider text-rose-300 text-[11px]">
            LIVE EARTH FEED
          </span>
        </button>

        {/* Professional Color Grading Preset Selector */}
        <div className="relative">
          <button
            onClick={() => {
              audio.playHover();
              setIsGradeMenuOpen(!isGradeMenuOpen);
            }}
            className="glass-panel px-2.5 py-1.5 sm:px-3 text-xs font-mono flex items-center gap-2 border-cyan-500/30 hover:border-cyan-400 text-slate-200 transition-all cursor-pointer"
            title="Professional Color Grading Profiles"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline text-[11px] font-display font-medium uppercase tracking-wider">
              {currentPreset.name}
            </span>
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: currentPreset.color }} 
            />
          </button>

          {/* Color Grading Dropdown Menu */}
          {isGradeMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 border-cyan-500/40">
              <div className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-white/5">
                Color Grading Profile
              </div>
              <div className="space-y-1">
                {COLOR_GRADE_PRESETS.map(preset => {
                  const active = colorGrade === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        audio.playSelect();
                        onChangeColorGrade(preset.id);
                        setIsGradeMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded text-left flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: preset.color }} 
                        />
                        <span>{preset.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2D / 3D Projection Toggle */}
        <div className="glass-panel p-1 flex items-center gap-1">
          <button
            onClick={() => {
              audio.playSelect();
              onToggleViewMode('3D');
            }}
            className={`px-2 py-1 sm:px-2.5 text-xs font-display flex items-center gap-1.5 rounded transition-all ${
              viewMode === '3D' 
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D GLOBE</span>
          </button>

          <button
            onClick={() => {
              audio.playSelect();
              onToggleViewMode('2D');
            }}
            className={`px-2 py-1 sm:px-2.5 text-xs font-display flex items-center gap-1.5 rounded transition-all ${
              viewMode === '2D' 
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D MAP</span>
          </button>
        </div>

        {/* Watchlist button */}
        <button
          onClick={() => {
            audio.playSelect();
            onOpenWatchlist();
          }}
          className="glass-panel p-2 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-colors relative"
          title="Open Watchlist"
        >
          <Bookmark className="w-4 h-4" />
          {watchlistCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center font-mono">
              {watchlistCount}
            </span>
          )}
        </button>

        {/* Compare button */}
        <button
          onClick={() => {
            audio.playSelect();
            onOpenCompare();
          }}
          className="glass-panel p-2 text-slate-300 hover:text-amber-400 hover:border-amber-400 transition-colors relative"
          title="Compare Satellites"
        >
          <Layers className="w-4 h-4" />
          {comparisonCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center font-mono">
              {comparisonCount}
            </span>
          )}
        </button>

        {/* Data Provenance modal button */}
        <button
          onClick={() => {
            audio.playSelect();
            onOpenProvenance();
          }}
          className="glass-panel p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          title="Data Provenance & Scientific Ephemeris"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Audio Mute toggle */}
        <button
          onClick={handleToggleSound}
          className="glass-panel p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Reset Camera View */}
        <button
          onClick={() => {
            audio.playSelect();
            onResetView();
          }}
          className="glass-panel p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Permission Toast Notification */}
      {showPermissionToast && (
        <div className="fixed top-20 right-6 z-50 glass-panel p-3.5 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top duration-300 max-w-sm">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-display text-xs font-bold text-white mb-0.5">
                ALL PERMISSIONS AUTHORIZED
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                WebGL 2.0 GPU hardware acceleration, Web Audio procedural synthesis, and high-frequency SGP4 telemetry channels are active.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
