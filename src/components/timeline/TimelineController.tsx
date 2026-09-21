import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Radio,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { TimeState } from '../../types/satellite';
import { audio } from '../../services/audioService';
import { formatISTTime, formatISTDate, getIndiaSolarStatus } from '../../services/timeSync';

interface TimelineControllerProps {
  timeState: TimeState;
  onChangeTimeState: (state: TimeState) => void;
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  timeState,
  onChangeTimeState
}) => {
  const [timelineOffsetMinutes, setTimelineOffsetMinutes] = useState(0); // offset from base Date.now() in minutes
  const [baseTime, setBaseTime] = useState<Date>(() => new Date());
  const [tzMode, setTzMode] = useState<'IST' | 'UTC'>('IST');

  // Real-time animation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeState.isPlaying) {
        const deltaSeconds = (timeState.speedMultiplier * 0.1);
        const nextTime = new Date(timeState.currentSimTime.getTime() + deltaSeconds * 1000);
        onChangeTimeState({
          ...timeState,
          currentSimTime: nextTime
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeState, onChangeTimeState]);

  const togglePlay = () => {
    audio.playSelect();
    onChangeTimeState({
      ...timeState,
      isPlaying: !timeState.isPlaying
    });
  };

  const setSpeed = (multiplier: number) => {
    audio.playWarp();
    onChangeTimeState({
      ...timeState,
      speedMultiplier: multiplier,
      isRealTime: multiplier === 1 && Math.abs(timeState.currentSimTime.getTime() - Date.now()) < 5000
    });
  };

  const syncRealTime = () => {
    audio.playSelect();
    const now = new Date();
    setBaseTime(now);
    setTimelineOffsetMinutes(0);
    onChangeTimeState({
      ...timeState,
      currentSimTime: now,
      isPlaying: true,
      speedMultiplier: 1,
      isRealTime: true
    });
  };

  const stepTime = (deltaMinutes: number) => {
    audio.playHover();
    const nextTime = new Date(timeState.currentSimTime.getTime() + deltaMinutes * 60 * 1000);
    onChangeTimeState({
      ...timeState,
      currentSimTime: nextTime,
      isRealTime: false
    });
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseFloat(e.target.value);
    setTimelineOffsetMinutes(minutes);
    const newTime = new Date(Date.now() + minutes * 60 * 1000);
    onChangeTimeState({
      ...timeState,
      currentSimTime: newTime,
      isRealTime: Math.abs(minutes) < 1
    });
  };

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Format date & time strings
  const simDate = timeState.currentSimTime;
  const istTimeStr = formatISTTime(simDate);
  const istDateStr = formatISTDate(simDate);
  const utcHours = String(simDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(simDate.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(simDate.getUTCSeconds()).padStart(2, '0');
  const utcTimeStr = `${utcHours}:${utcMinutes}:${utcSeconds}`;
  const utcDateStr = simDate.toISOString().split('T')[0];

  const timeStr = tzMode === 'IST' ? `${istTimeStr} IST` : `${utcTimeStr} UTC`;
  const dateStr = tzMode === 'IST' ? `${istDateStr}` : `${utcDateStr}`;
  const indiaSolar = getIndiaSolarStatus(simDate);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-2 sm:p-3 md:p-4 pb-safe flex flex-col items-center">
      <div className="pointer-events-auto w-full max-w-4xl glass-panel p-2.5 sm:p-3 border-cyan-500/30 shadow-2xl flex flex-col gap-2">
        {/* Top bar: Date, Play controls, Speed Multipliers */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2 text-xs font-mono">
          {/* Left: Date & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span className="font-display font-bold text-white text-xs sm:text-sm tracking-wider">
                {timeStr}
              </span>
              <span className="text-slate-400 text-[10px] sm:text-xs hidden sm:inline">{dateStr}</span>
            </div>

            {/* Timezone Switcher Pill */}
            <div className="flex items-center bg-black/50 p-0.5 rounded border border-cyan-500/20 text-[10px]">
              <button
                onClick={() => {
                  audio.playHover();
                  setTzMode('IST');
                }}
                className={`px-1.5 py-0.5 rounded font-display transition-all cursor-pointer ${
                  tzMode === 'IST' 
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Display in Indian Standard Time (UTC+05:30)"
              >
                IST (+5:30)
              </button>
              <button
                onClick={() => {
                  audio.playHover();
                  setTzMode('UTC');
                }}
                className={`px-1.5 py-0.5 rounded font-display transition-all cursor-pointer ${
                  tzMode === 'UTC' 
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Display in Universal Coordinated Time (UTC)"
              >
                UTC
              </button>
            </div>

            {/* India Day/Night Illumination Condition Pill */}
            <div 
              className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                indiaSolar.isDaytime
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
              }`}
              title={indiaSolar.description}
            >
              {indiaSolar.isDaytime ? (
                <Sun className="w-3 h-3 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-3 h-3 text-indigo-300" />
              )}
              <span>{indiaSolar.statusLabel} IN INDIA</span>
            </div>

            {timeState.isRealTime ? (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                WARP {timeState.speedMultiplier}x
              </span>
            )}
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 p-1 rounded-lg border border-cyan-500/20">
            {/* Step -15m (hidden on small mobile unless expanded) */}
            <button
              onClick={() => stepTime(-15)}
              className={`p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer ${
                isMobileExpanded ? 'block' : 'hidden md:block'
              }`}
              title="Step -15 Minutes"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className={`p-1.5 sm:p-2 rounded font-display transition-all cursor-pointer ${
                timeState.isPlaying
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={timeState.isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {timeState.isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Step +15m (hidden on small mobile unless expanded) */}
            <button
              onClick={() => stepTime(15)}
              className={`p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer ${
                isMobileExpanded ? 'block' : 'hidden md:block'
              }`}
              title="Step +15 Minutes"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Speed Multipliers & Real-Time Sync */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Speed buttons (visible on desktop or when expanded on mobile) */}
            <div className={`items-center gap-1 bg-black/40 p-1 rounded border border-slate-800 ${
              isMobileExpanded ? 'flex overflow-x-auto no-scrollbar touch-scroll' : 'hidden md:flex'
            }`}>
              {[1, 10, 60, 300, 1000].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-display transition-all cursor-pointer whitespace-nowrap ${
                    timeState.speedMultiplier === speed
                      ? 'bg-cyan-400 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={syncRealTime}
              className={`px-2 sm:px-2.5 py-1 rounded font-display text-[9px] sm:text-[10px] tracking-wider uppercase border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                timeState.isRealTime
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20'
              }`}
              title="Snap directly to current live IST (Indian Standard Time)"
            >
              <Radio className={`w-3 h-3 ${timeState.isRealTime ? 'animate-pulse text-emerald-400' : ''}`} />
              <span className="hidden xs:inline">SYNC LIVE IST</span>
              <span className="inline xs:hidden">LIVE IST</span>
            </button>

            {/* Mobile Expand / Minimize Toggle Button */}
            <button
              onClick={() => {
                audio.playHover();
                setIsMobileExpanded(!isMobileExpanded);
              }}
              className="md:hidden p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMobileExpanded ? 'Minimize Timeline' : 'Expand Timeline Controls'}
            >
              {isMobileExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Bottom: Interactive Scrubber Slider (visible on desktop or when expanded on mobile) */}
        <div className={`flex-col gap-1 ${isMobileExpanded ? 'flex' : 'hidden md:flex'}`}>
          <div className="relative flex items-center px-1 pt-1">
            <input
              type="range"
              min="-720" // -12 hours
              max="720"  // +12 hours
              step="1"
              value={timelineOffsetMinutes}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-ew-resize accent-cyan-400 border border-cyan-500/20"
            />
          </div>

          {/* Timeline tick labels */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
            <span>-12h</span>
            <span>-6h</span>
            <span>-2h</span>
            <span className="text-cyan-400 font-bold">NOW</span>
            <span>+2h</span>
            <span>+6h</span>
            <span>+12h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
