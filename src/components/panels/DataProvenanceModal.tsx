import React from 'react';
import { X, ShieldCheck, Database, Cpu, Globe, ExternalLink } from 'lucide-react';
import { audio } from '../../services/audioService';

interface DataProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataProvenanceModal: React.FC<DataProvenanceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel border-cyan-500/40 p-6 md:p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Corner Brackets */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                SCIENTIFIC DATA PROVENANCE
              </h2>
              <div className="text-xs font-mono text-slate-400">
                AEROSPACE ORBITAL MECHANICS & EPHEMERIS SPECIFICATION
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playHover();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 font-mono text-xs text-slate-300">
          <div className="p-3.5 rounded bg-black/40 border border-cyan-500/20">
            <div className="font-display font-bold text-cyan-400 text-xs mb-1 flex items-center gap-2">
              <Database className="w-4 h-4" />
              ORBITAL EPHEMERIS & CATALOG
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Orbital parameters are derived from General Perturbations (GP) Two-Line Element sets (TLEs) maintained by the 18th Space Defense Squadron (Space-Track.org) and indexed by CelesTrak.
            </p>
          </div>

          <div className="p-3.5 rounded bg-black/40 border border-cyan-500/20">
            <div className="font-display font-bold text-emerald-400 text-xs mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              SGP4 / SDP4 PROPAGATION ENGINE
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Calculations strictly utilize standard Simplified General Perturbations (SGP4) and Simplified Deep-Space Perturbations (SDP4) algorithms with secular and periodic variations caused by Earth oblateness ($J_2, J_3, J_4$), atmospheric drag, and lunar/solar gravitational perturbations.
            </p>
          </div>

          <div className="p-3.5 rounded bg-black/40 border border-cyan-500/20">
            <div className="font-display font-bold text-amber-400 text-xs mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              COORDINATE REFERENCE SYSTEMS
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Propagated position vectors in the True Equator Mean Equinox (TEME) inertial frame are transformed via Greenwich Mean Sidereal Time (GMST) into Earth-Centered Earth-Fixed (ECEF) and WGS-84 ellipsoidal Geodetic Latitude, Longitude, and Altitude.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            EarthOrbit 3D • Open Aerospace Intelligence
          </span>
          <button
            onClick={() => {
              audio.playHover();
              onClose();
            }}
            className="glass-button text-xs py-1.5 px-4 text-cyan-300"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
