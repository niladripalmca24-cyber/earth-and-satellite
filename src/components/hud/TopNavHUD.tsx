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
  Sparkles,
  MoreHorizontal,
  Sun,
  Moon,
  Compass,
  SunMedium
} from 'lucide-react';
import { ViewMode, TimeState, ColorGradeMode } from '../../types/satellite';
import { audio } from '../../services/audioService';
import { formatISTTime, formatISTDate, getIndiaSolarStatus } from '../../services/timeSync';

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
  earthBrightness?: number;
  onChangeEarthBrightness?: (brightness: number) => void;
  onFocusIndia?: () => void;
  onSelectMission?: (key: string) => void;
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
  onOpenLiveEarthFeed,
  earthBrightness = 1.45,
  onChangeEarthBrightness,
  onFocusIndia,
  onSelectMission
}) => {
  const [isMuted, setIsMuted] = useState(audio.getMuted());
  const [timeZone, setTimeZone] = useState<'IST' | 'UTC'>('IST');
  const [utcString, setUtcString] = useState('');
  const [istString, setIstString] = useState('');
  const [julianDate, setJulianDate] = useState('');
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [showPermissionToast, setShowPermissionToast] = useState(false);

  // Update IST, UTC and Julian date clock
  useEffect(() => {
    const updateClock = () => {
      const now = timeState.currentSimTime;
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcString(`${hours}:${minutes}:${seconds} UTC`);
      setIstString(`${formatISTTime(now)} IST`);

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
  const indiaSolar = getIndiaSolarStatus(timeState.currentSimTime);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none px-2.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between font-ui">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
        <div 
          onClick={onReplayCinematic}
          className="glass-panel px-2.5 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2.5 sm:gap-3 cursor-pointer hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          title="Return to cinematic intro"
        >
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <div>
            <div className="font-hero font-extrabold text-[11px] sm:text-sm tracking-wider text-white">
              EARTHORBIT <span className="text-cyan-400">3D</span>
            </div>
            <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 tracking-wider hidden xs:block">
              MISSION INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Mobile compact IST / UTC clock */}
        <button
          onClick={() => {
            audio.playHover();
            setTimeZone(tz => tz === 'IST' ? 'UTC' : 'IST');
          }}
          className="lg:hidden text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 whitespace-nowrap flex items-center gap-1 cursor-pointer"
          title="Click to toggle between IST and UTC"
        >
          <span>{timeZone === 'IST' ? istString : utcString}</span>
        </button>

        {/* Live Status indicator (desktop) */}
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

      {/* Center: Mission Chronometer (desktop/large screens) */}
      <div className="hidden lg:flex pointer-events-auto items-center gap-3 glass-panel px-3 sm:px-4 py-1.5 sm:py-2 border-cyan-500/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs sm:text-base font-bold text-cyan-300 tracking-wider">
              {timeZone === 'IST' ? istString : utcString}
            </span>
            {/* Quick toggle pill */}
            <button
              onClick={() => {
                audio.playHover();
                setTimeZone(tz => tz === 'IST' ? 'UTC' : 'IST');
              }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 hover:text-white cursor-pointer"
              title="Toggle timezone display (IST / UTC)"
            >
              {timeZone === 'IST' ? '⇄ UTC' : '⇄ IST'}
            </button>
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <span>{timeZone === 'IST' ? 'UTC+05:30 (INDIA)' : julianDate}</span>
            <span>•</span>
            <span className={indiaSolar.isDaytime ? 'text-amber-400 font-bold' : 'text-indigo-300'}>
              {indiaSolar.isDaytime ? '☀️ IST DAYLIGHT' : '🌙 IST NIGHT'}
            </span>
            <span>•</span>
            <span>{timeState.isRealTime ? 'LIVE' : `${timeState.speedMultiplier}x`}</span>
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
          className="glass-panel px-2 py-1.5 sm:px-3 text-xs font-mono flex items-center gap-1.5 sm:gap-2 border-rose-500/40 hover:border-rose-400 text-slate-200 transition-all cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          title="Open Real-Life Live Earth Video Streams & Satellite Feeds"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="hidden sm:inline font-display font-bold tracking-wider text-rose-300 text-[11px]">
            LIVE EARTH FEED
          </span>
          <span className="inline sm:hidden font-display font-bold tracking-wider text-rose-300 text-[10px]">
            LIVE
          </span>
        </button>

        {/* 2D / 3D Projection Toggle */}
        <div className="glass-panel p-1 flex items-center gap-1">
          <button
            onClick={() => {
              audio.playSelect();
              onToggleViewMode('3D');
            }}
            className={`px-1.5 py-1 sm:px-2.5 text-xs font-display flex items-center gap-1 sm:gap-1.5 rounded transition-all ${
              viewMode === '3D' 
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D</span>
          </button>

          <button
            onClick={() => {
              audio.playSelect();
              onToggleViewMode('2D');
            }}
            className={`px-1.5 py-1 sm:px-2.5 text-xs font-display flex items-center gap-1 sm:gap-1.5 rounded transition-all ${
              viewMode === '2D' 
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D</span>
          </button>
        </div>

        {/* Quick Focus India / IST Meridian Button */}
        {onFocusIndia && (
          <button
            onClick={() => {
              audio.playSelect();
              onFocusIndia();
            }}
            className="glass-panel px-2 py-1 sm:px-2.5 text-xs font-mono flex items-center gap-1 sm:gap-1.5 border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Swoop camera directly to India & Indian Ocean (IST Meridian 82.5°E)"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-bold text-[11px]">INDIA (IST)</span>
            <span className="inline sm:hidden font-bold text-[11px]">IST</span>
          </button>
        )}

        {/* Audio Mute toggle (always visible) */}
        <button
          onClick={handleToggleSound}
          className="glass-panel p-1.5 sm:p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* DESKTOP-ONLY DIRECT ACCESS TOOL BUTTONS */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
          {/* Professional Color Grading Preset Selector */}
          <div className="relative">
            <button
              onClick={() => {
                audio.playHover();
                setIsGradeMenuOpen(!isGradeMenuOpen);
              }}
              className="glass-panel px-2.5 py-1.5 sm:px-3 text-xs font-mono flex items-center gap-2 border-cyan-500/30 hover:border-cyan-400 text-slate-200 transition-all cursor-pointer"
              title="Professional Color Grading & Earth Luminance"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline text-[11px] font-display font-medium uppercase tracking-wider">
                {currentPreset.name}
              </span>
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: currentPreset.color }} 
              />
            </button>

            {/* Color Grading & Lighting Dropdown Menu */}
            {isGradeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 border-cyan-500/40">
                <div className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider px-1 py-1 mb-1 border-b border-white/5">
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
                        className={`w-full px-2 py-1.5 rounded text-left flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
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

                {/* Real Earth Model Luminance & Brightness Slider */}
                {onChangeEarthBrightness && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 px-1">
                    <div className="flex items-center justify-between text-[10px] font-display font-bold text-slate-300 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1">
                        <SunMedium className="w-3.5 h-3.5 text-cyan-400" />
                        Earth Brightness
                      </span>
                      <span className="text-cyan-400 font-mono font-bold">{Math.round(earthBrightness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.05"
                      value={earthBrightness}
                      onChange={e => onChangeEarthBrightness(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-cyan-400 border border-cyan-500/20"
                    />
                    <div className="grid grid-cols-3 gap-1 mt-1.5">
                      {[
                        { label: 'Normal', val: 1.15 },
                        { label: 'Vivid', val: 1.45 },
                        { label: 'Brilliant', val: 1.85 },
                      ].map(b => (
                        <button
                          key={b.val}
                          onClick={() => {
                            audio.playHover();
                            onChangeEarthBrightness(b.val);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono text-center transition-all cursor-pointer ${
                            Math.abs(earthBrightness - b.val) < 0.1
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-bold'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Watchlist button */}
          <button
            onClick={() => {
              audio.playSelect();
              onOpenWatchlist();
            }}
            className="glass-panel p-2 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-colors relative cursor-pointer"
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
            className="glass-panel p-2 text-slate-300 hover:text-amber-400 hover:border-amber-400 transition-colors relative cursor-pointer"
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
            className="glass-panel p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            title="Data Provenance & Scientific Ephemeris"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Reset Camera View */}
          <button
            onClick={() => {
              audio.playSelect();
              onResetView();
            }}
            className="glass-panel p-2 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* MOBILE QUICK TOOLS BUTTON (< md) */}
        <div className="relative md:hidden">
          <button
            onClick={() => {
              audio.playHover();
              setIsMobileToolsOpen(!isMobileToolsOpen);
            }}
            className="glass-panel p-1.5 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors relative cursor-pointer"
            title="Mission Tools Menu"
          >
            <MoreHorizontal className="w-4 h-4" />
            {(watchlistCount > 0 || comparisonCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          {/* Mobile Tools Dropdown */}
          {isMobileToolsOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 border-cyan-500/40 text-xs font-mono">
              {/* Watchlist & Compare Quick Row */}
              <div className="grid grid-cols-2 gap-2 pb-2.5 mb-2.5 border-b border-white/10">
                <button
                  onClick={() => {
                    audio.playSelect();
                    onOpenWatchlist();
                    setIsMobileToolsOpen(false);
                  }}
                  className="p-2 rounded bg-black/40 border border-cyan-500/20 hover:border-cyan-400 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Watchlist</span>
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300">{watchlistCount}</span>
                </button>

                <button
                  onClick={() => {
                    audio.playSelect();
                    onOpenCompare();
                    setIsMobileToolsOpen(false);
                  }}
                  className="p-2 rounded bg-black/40 border border-amber-500/20 hover:border-amber-400 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Compare</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-300">{comparisonCount}</span>
                </button>
              </div>

              {/* Color Grading Profiles */}
              <div className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Color Grading Profile
              </div>
              <div className="space-y-1 mb-2">
                {COLOR_GRADE_PRESETS.map(preset => {
                  const active = colorGrade === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        audio.playSelect();
                        onChangeColorGrade(preset.id);
                        setIsMobileToolsOpen(false);
                      }}
                      className={`w-full px-2 py-1.5 rounded text-left flex items-center justify-between transition-all cursor-pointer ${
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
                      {active && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Provenance & Reset Camera */}
              <div className="pt-2 border-t border-white/10 space-y-1">
                <button
                  onClick={() => {
                    audio.playSelect();
                    onOpenProvenance();
                    setIsMobileToolsOpen(false);
                  }}
                  className="w-full px-2 py-1.5 rounded text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scientific Provenance</span>
                </button>
                <button
                  onClick={() => {
                    audio.playSelect();
                    onResetView();
                    setIsMobileToolsOpen(false);
                  }}
                  className="w-full px-2 py-1.5 rounded text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset 3D Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
