import React from 'react';
import { X, Bookmark, ArrowRight, Trash2, Radio } from 'lucide-react';
import { SatelliteData, TimeState } from '../../types/satellite';
import { propagateSatellite } from '../../services/orbitalEngine';
import { audio } from '../../services/audioService';

interface WatchlistDrawerProps {
  satellites: SatelliteData[];
  onRemoveSatellite: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSelectSatellite: (sat: SatelliteData) => void;
  timeState: TimeState;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  satellites,
  onRemoveSatellite,
  onClearAll,
  onClose,
  onSelectSatellite,
  timeState
}) => {
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md glass-panel border-l border-cyan-500/30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display font-bold text-sm tracking-wider text-white uppercase">
            SATELLITE WATCHLIST ({satellites.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {satellites.length > 0 && (
            <button
              onClick={() => {
                audio.playHover();
                onClearAll();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => {
              audio.playHover();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {satellites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Bookmark className="w-12 h-12 text-slate-600 mb-3" />
            <div className="font-display text-sm text-slate-400 mb-1">NO PINNED SATELLITES</div>
            <p className="text-xs font-mono max-w-xs leading-relaxed">
              Pin your high-interest missions (ISS, Starlink, Hubble, etc.) by clicking the Watchlist bookmark icon in any satellite panel.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {satellites.map(sat => {
              const telem = propagateSatellite(sat, timeState.currentSimTime);
              return (
                <div
                  key={sat.id}
                  onClick={() => {
                    audio.playSelect();
                    onSelectSatellite(sat);
                  }}
                  className="p-3 rounded-lg bg-black/50 border border-slate-800 hover:border-cyan-400/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge-regime ${sat.regime}`}>{sat.regime}</span>
                        <span className="text-[10px] font-mono text-cyan-400">#{sat.id}</span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {sat.name}
                      </h4>
                      <div className="text-[11px] font-mono text-slate-400">
                        {sat.operator}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSatellite(sat.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      title="Remove bookmark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{telem ? `${Math.round(telem.alt)} km` : '---'}</span>
                    </div>
                    <div className="text-slate-400">
                      {telem ? `${telem.velocity} km/s` : '---'}
                    </div>
                    <div className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span className="text-[10px] font-display">TRACK</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
