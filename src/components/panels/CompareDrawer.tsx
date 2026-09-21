import React from 'react';
import { X, Layers, Trash2, ArrowRight } from 'lucide-react';
import { SatelliteData, TimeState } from '../../types/satellite';
import { propagateSatellite } from '../../services/orbitalEngine';
import { audio } from '../../services/audioService';

interface CompareDrawerProps {
  satellites: SatelliteData[];
  onRemoveSatellite: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSelectSatellite: (sat: SatelliteData) => void;
  timeState: TimeState;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  satellites,
  onRemoveSatellite,
  onClearAll,
  onClose,
  onSelectSatellite,
  timeState
}) => {
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl glass-panel border-l border-amber-500/30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-amber-500/20 flex items-center justify-between gap-2 bg-black/40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
          <h2 className="font-display font-bold text-xs sm:text-sm tracking-wider text-white uppercase truncate">
            ORBITAL COMPARISON ({satellites.length}/3)
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {satellites.length > 0 && (
            <button
              onClick={() => {
                audio.playHover();
                onClearAll();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono p-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <button
            onClick={() => {
              audio.playHover();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 no-scrollbar touch-scroll">
        {satellites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Layers className="w-12 h-12 text-slate-600 mb-3" />
            <div className="font-display text-sm text-slate-400 mb-1">NO SATELLITES SELECTED</div>
            <p className="text-xs font-mono max-w-xs leading-relaxed">
              Click any satellite on the globe or list and press "COMPARE" to visualize and analyze multiple orbits simultaneously.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cards for each satellite */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {satellites.map(sat => {
                const telem = propagateSatellite(sat, timeState.currentSimTime);
                return (
                  <div
                    key={sat.id}
                    className="p-3.5 rounded-lg bg-black/50 border border-amber-500/20 hover:border-amber-400/50 transition-colors relative"
                  >
                    <button
                      onClick={() => onRemoveSatellite(sat.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-400 p-1"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge-regime ${sat.regime}`}>{sat.regime}</span>
                      <span className="text-[10px] font-mono text-slate-400">#{sat.id}</span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-white mb-1">
                      {sat.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mb-3">
                      {sat.operator} ({sat.country})
                    </div>

                    <div className="space-y-1.5 text-xs font-mono border-t border-white/5 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Altitude:</span>
                        <span className="text-cyan-300 font-bold">
                          {telem ? `${Math.round(telem.alt)} km` : `${sat.apogeeKm} km`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Velocity:</span>
                        <span className="text-emerald-400 font-bold">
                          {telem ? `${telem.velocity} km/s` : '---'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Period:</span>
                        <span className="text-white">{sat.periodMin} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inclination:</span>
                        <span className="text-white">{sat.inclinationDeg}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-amber-300">{sat.category.replace('_', ' ')}</span>
                      </div>
                      {sat.launchVehicle && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rocket:</span>
                          <span className="text-white font-medium truncate max-w-[140px]" title={sat.launchVehicle}>{sat.launchVehicle}</span>
                        </div>
                      )}
                      {sat.powerWatts && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Power:</span>
                          <span className="text-amber-400 font-bold">{sat.powerWatts >= 1000 ? `${(sat.powerWatts / 1000).toFixed(1)} kW` : `${sat.powerWatts} W`}</span>
                        </div>
                      )}
                      {sat.massKg && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mass:</span>
                          <span className="text-white">{sat.massKg.toLocaleString()} kg</span>
                        </div>
                      )}
                      {sat.payloadInstruments && sat.payloadInstruments.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payloads:</span>
                          <span className="text-cyan-300 font-bold">{sat.payloadInstruments.length} sensors</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectSatellite(sat)}
                      className="mt-3 w-full py-1.5 px-2 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-display text-[10px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>FOCUS ON GLOBE</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
