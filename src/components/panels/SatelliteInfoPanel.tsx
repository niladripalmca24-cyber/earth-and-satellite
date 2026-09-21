import React from 'react';
import { 
  X, 
  Orbit, 
  Radio, 
  Compass, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Layers, 
  Navigation,
  Globe,
  Gauge,
  Zap,
  Rocket,
  Cpu,
  Sparkles,
  Check
} from 'lucide-react';
import { SatelliteData, SatelliteTelemetry, TimeState, GroundStation } from '../../types/satellite';
import { propagateSatellite } from '../../services/orbitalEngine';
import { audio } from '../../services/audioService';

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  timeState: TimeState;
  groundStations: GroundStation[];
  isFollowMode: boolean;
  onToggleFollow: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (sat: SatelliteData) => void;
  isCompared: boolean;
  onToggleCompare: (sat: SatelliteData) => void;
  onOpenDeepDive: (sat: SatelliteData) => void;
}

export const SatelliteInfoPanel: React.FC<SatelliteInfoPanelProps> = ({
  satellite,
  onClose,
  timeState,
  groundStations,
  isFollowMode,
  onToggleFollow,
  isWatchlisted,
  onToggleWatchlist,
  isCompared,
  onToggleCompare,
  onOpenDeepDive
}) => {
  if (!satellite) return null;

  // Compute live telemetry for current sim time
  const telem: SatelliteTelemetry | null = propagateSatellite(satellite, timeState.currentSimTime, groundStations);

  const formatLat = (lat: number) => {
    const dir = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(2)}° ${dir}`;
  };

  const formatLng = (lng: number) => {
    const dir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lng).toFixed(2)}° ${dir}`;
  };

  return (
    <aside className="absolute top-16 right-4 bottom-24 w-88 max-w-[calc(100vw-2rem)] z-20 glass-panel flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right">
      {/* Corner Brackets */}
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge-regime ${satellite.regime}`}>
              {satellite.regime}
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              NORAD #{satellite.id}
            </span>
            {satellite.constellation && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                {satellite.constellation}
              </span>
            )}
          </div>
          <h2 className="text-base font-display font-black text-white tracking-wide">
            {satellite.name}
          </h2>
          <div className="text-[11px] font-mono text-slate-400">
            {satellite.operator} • {satellite.country}
          </div>
        </div>

        <button
          onClick={() => {
            audio.playHover();
            onClose();
          }}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {/* Live Dynamics Telemetry Box */}
        <div className="p-3 rounded bg-cyan-950/20 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-display text-[11px] font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE SGP4 TELEMETRY</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LOCK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
              <div className="text-[10px] text-slate-400">ALTITUDE</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {telem ? `${Math.round(telem.alt).toLocaleString()} km` : '---'}
              </div>
            </div>

            <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
              <div className="text-[10px] text-slate-400">VELOCITY</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {telem ? `${telem.velocity} km/s` : '---'}
              </div>
            </div>

            <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
              <div className="text-[10px] text-slate-400">SUB-SAT LAT</div>
              <div className="text-xs font-bold text-white mt-0.5">
                {telem ? formatLat(telem.lat) : '---'}
              </div>
            </div>

            <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
              <div className="text-[10px] text-slate-400">SUB-SAT LNG</div>
              <div className="text-xs font-bold text-white mt-0.5">
                {telem ? formatLng(telem.lng) : '---'}
              </div>
            </div>
          </div>

          {/* Sensor Coverage */}
          <div className="mt-2 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Footprint Radius:</span>
            <span className="text-cyan-300 font-bold">
              {telem ? `${Math.round(telem.footprintRadiusKm).toLocaleString()} km` : '---'}
            </span>
          </div>

          {/* Ground Station Contact */}
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Ground Contact:</span>
            <span className="text-emerald-400 font-bold">
              {telem && telem.inRangeGroundStations && telem.inRangeGroundStations.length > 0
                ? `${telem.inRangeGroundStations.length} Station(s)`
                : 'In Open Transit'}
            </span>
          </div>
        </div>

        {/* Spacecraft Engineering Quick Specs */}
        {(satellite.launchVehicle || satellite.powerWatts || satellite.propulsionType) && (
          <div className="p-3 rounded bg-black/40 border border-cyan-500/20 space-y-1.5">
            <div className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Engineering Dossier</span>
            </div>

            {satellite.launchVehicle && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-rose-400" /> Rocket:
                </span>
                <span className="text-white font-bold">{satellite.launchVehicle}</span>
              </div>
            )}

            {satellite.powerWatts && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Power:
                </span>
                <span className="text-amber-300 font-bold">
                  {satellite.powerWatts >= 1000 ? `${(satellite.powerWatts / 1000).toFixed(1)} kW` : `${satellite.powerWatts} W`}
                </span>
              </div>
            )}

            {satellite.propulsionType && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" /> Propulsion:
                </span>
                <span className="text-slate-200 text-right truncate max-w-[170px]" title={satellite.propulsionType}>
                  {satellite.propulsionType}
                </span>
              </div>
            )}

            {satellite.payloadInstruments && satellite.payloadInstruments.length > 0 && (
              <div className="pt-1.5 border-t border-white/5">
                <span className="text-slate-400 text-[10px] block mb-1">
                  Key Payloads ({satellite.payloadInstruments.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {satellite.payloadInstruments.slice(0, 3).map((inst, i) => (
                    <span 
                      key={i} 
                      className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-700 text-slate-300 truncate max-w-[240px]"
                    >
                      {inst}
                    </span>
                  ))}
                  {satellite.payloadInstruments.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-400 font-bold">
                      +{satellite.payloadInstruments.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keplerian Orbital Parameters */}
        <div>
          <div className="font-display text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            <span>Orbital Elements</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Inclination:</span>
              <span className="text-white font-bold">{satellite.inclinationDeg ?? 51.6}°</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Orbital Period:</span>
              <span className="text-white font-bold">{satellite.periodMin ?? 92.5} min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Apogee:</span>
              <span className="text-white font-bold">{satellite.apogeeKm?.toLocaleString()} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Perigee:</span>
              <span className="text-white font-bold">{satellite.perigeeKm?.toLocaleString()} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Intl Designator:</span>
              <span className="text-cyan-300 font-bold">{satellite.intlDes}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Launch Date:</span>
              <span className="text-white font-bold">{satellite.launchDate || satellite.launchYear}</span>
            </div>
            {satellite.massKg && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Spacecraft Mass:</span>
                <span className="text-white font-bold">{satellite.massKg.toLocaleString()} kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Mission Highlights Snippet */}
        {satellite.missionHighlights && satellite.missionHighlights.length > 0 && (
          <div className="p-3 rounded bg-cyan-950/20 border border-cyan-500/20">
            <div className="font-display text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Mission Highlight</span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans leading-relaxed flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{satellite.missionHighlights[0]}</span>
            </div>
          </div>
        )}

        {/* Mission Briefing */}
        {satellite.description && (
          <div>
            <div className="font-display text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Mission Overview
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
              {satellite.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="p-3 border-t border-cyan-500/20 bg-black/50 space-y-2">
        {/* Full Dossier Button (Primary CTA) */}
        <button
          onClick={() => {
            audio.playSelect();
            onOpenDeepDive(satellite);
          }}
          className="w-full py-2.5 px-3 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:text-white font-display text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>OPEN SPACECRAFT DOSSIER</span>
        </button>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Follow Camera Button */}
          <button
            onClick={() => {
              audio.playSelect();
              onToggleFollow();
            }}
            className={`py-2 px-1.5 rounded font-display text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isFollowMode
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                : 'glass-button text-cyan-300 hover:text-white'
            }`}
            title="Lock camera onto this satellite"
          >
            <Navigation className={`w-3 h-3 ${isFollowMode ? 'animate-spin' : ''}`} />
            <span>{isFollowMode ? 'FOLLOW' : 'FOLLOW'}</span>
          </button>

          {/* Watchlist Toggle Button */}
          <button
            onClick={() => {
              audio.playSelect();
              onToggleWatchlist(satellite);
            }}
            className={`py-2 px-1.5 rounded font-display text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isWatchlisted
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-bold'
                : 'glass-button text-slate-300 hover:text-white'
            }`}
            title="Add to watchlist"
          >
            {isWatchlisted ? <BookmarkCheck className="w-3 h-3 text-cyan-400" /> : <Bookmark className="w-3 h-3" />}
            <span>{isWatchlisted ? 'SAVED' : 'SAVE'}</span>
          </button>

          {/* Compare Button */}
          <button
            onClick={() => {
              audio.playSelect();
              onToggleCompare(satellite);
            }}
            className={`py-2 px-1.5 rounded font-display text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isCompared
                ? 'bg-amber-500/30 border border-amber-400 text-amber-300 font-bold'
                : 'glass-button text-slate-300 hover:text-amber-400'
            }`}
            title="Compare with other satellites"
          >
            <Layers className="w-3 h-3" />
            <span>{isCompared ? 'COMPARING' : 'COMPARE'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
