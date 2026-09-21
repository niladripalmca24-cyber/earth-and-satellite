import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Clock, 
  ShieldCheck, 
  Satellite as SatIcon
} from 'lucide-react';
import { audio } from '../../services/audioService';

export interface LiveEarthFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMiniMode?: boolean;
  onToggleMiniMode?: () => void;
}

export interface FeedChannel {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  type: 'stream' | 'image';
  sourceName: string;
  resolution: string;
  updateFrequency: string;
  altitudeKm: number;
  description: string;
  streamUrls?: string[];
  imageUrl?: string;
  spectralInfo?: string;
}

const FEED_CHANNELS: FeedChannel[] = [
  {
    id: 'iss_live',
    name: 'NASA ISS Live HD Earth Stream',
    badge: 'LIVE VIDEO',
    badgeColor: 'bg-rose-500 text-white',
    type: 'stream',
    sourceName: 'NASA Johnson Space Center / ISS External High Definition Cameras',
    resolution: '1080p 60fps Live Video',
    updateFrequency: 'Real-time Streaming',
    altitudeKm: 420,
    description: 'Live continuous high-definition video views of Earth captured by external payload cameras aboard the International Space Station orbiting at 27,600 km/h.',
    streamUrls: [
      'https://www.youtube-nocookie.com/embed/P9C25Un7xaM?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0',
      'https://www.youtube-nocookie.com/embed/xRPjKOmvkW4?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0',
      'https://www.youtube-nocookie.com/embed/4993sBLAzGA?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0',
    ],
    spectralInfo: 'Visible Optical RGB // Low Earth Orbit Forward/Nadir Cameras'
  },
  {
    id: 'goes_east',
    name: 'NOAA GOES-East (GOES-16) Full Disk',
    badge: 'GEOSTATIONARY',
    badgeColor: 'bg-cyan-500 text-slate-950',
    type: 'image',
    sourceName: 'NOAA / NESDIS / NASA Goddard Space Flight Center',
    resolution: '1808 × 1808 TrueColor',
    updateFrequency: 'Every 10 Minutes',
    altitudeKm: 35786,
    description: 'Real-time full disk multispectral GeoColor imagery of the Americas, Atlantic Ocean, and Caribbean captured from 35,786 km in geostationary orbit.',
    imageUrl: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/1808x1808.jpg',
    spectralInfo: 'Advanced Baseline Imager (ABI) Bands 1-16 (Red, Blue, Simulated Green & Longwave IR)'
  },
  {
    id: 'goes_west',
    name: 'NOAA GOES-West (GOES-18) Full Disk',
    badge: 'GEOSTATIONARY',
    badgeColor: 'bg-cyan-500 text-slate-950',
    type: 'image',
    sourceName: 'NOAA / NESDIS Satellite Operations',
    resolution: '1808 × 1808 TrueColor',
    updateFrequency: 'Every 10 Minutes',
    altitudeKm: 35786,
    description: 'Real-time operational geostationary view of the Pacific Ocean, Hawaii, Alaska, and Western North America showing active cyclone dynamics and cloud systems.',
    imageUrl: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/1808x1808.jpg',
    spectralInfo: 'ABI Sensor // Pacific Operational Weather Coverage at 137.2° W'
  },
  {
    id: 'dscovr_epic',
    name: 'NASA DSCOVR EPIC (1,000,000 Miles)',
    badge: 'DEEP SPACE L1',
    badgeColor: 'bg-purple-500 text-white',
    type: 'image',
    sourceName: 'NASA GSFC / NOAA / US Space Force',
    resolution: '2048 × 2048 Natural Color',
    updateFrequency: 'Every 2 Hours',
    altitudeKm: 1500000,
    description: 'Earth Polychromatic Imaging Camera (EPIC) view captured from the Sun-Earth L1 Lagrange point one million miles away, capturing the entire sunlit face of Earth.',
    imageUrl: 'https://epic.gsfc.nasa.gov/api/natural',
    spectralInfo: 'Cassegrain Telescope with 10 Narrowband Filters (317–780 nm)'
  },
  {
    id: 'himawari_asia',
    name: 'JMA Himawari-9 (Asia & Pacific)',
    badge: 'GEOSTATIONARY',
    badgeColor: 'bg-emerald-500 text-slate-950',
    type: 'image',
    sourceName: 'Japan Meteorological Agency / NOAA',
    resolution: '1808 × 1808 Full Disk',
    updateFrequency: 'Every 10 Minutes',
    altitudeKm: 35786,
    description: 'Real-time weather and typhoon imagery over East Asia, Japan, Australia, and the Western Pacific basin centered at 140.7° E.',
    imageUrl: 'https://cdn.star.nesdis.noaa.gov/HIMAWARI/AHI/FD/GEOCOLOR/1808x1808.jpg',
    spectralInfo: 'Advanced Himawari Imager (AHI) 16 Optical & Infrared Channels'
  }
];

export const LiveEarthFeedModal: React.FC<LiveEarthFeedModalProps> = ({
  isOpen,
  onClose,
  isMiniMode = false,
  onToggleMiniMode
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>('iss_live');
  const [streamBackupIndex, setStreamBackupIndex] = useState<number>(0);
  const [imageRefreshKey, setImageRefreshKey] = useState<number>(Date.now());
  const [lastRefreshedTime, setLastRefreshedTime] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [epicImageUrl, setEpicImageUrl] = useState<string | null>(null);

  const activeChannel = FEED_CHANNELS.find(c => c.id === activeChannelId) || FEED_CHANNELS[0];

  // Fetch dynamic NASA DSCOVR EPIC photo if channel selected
  useEffect(() => {
    if (activeChannelId === 'dscovr_epic') {
      setIsImageLoading(true);
      fetch('https://epic.gsfc.nasa.gov/api/natural')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            const dateParts = latest.date.split(' ')[0].split('-');
            const year = dateParts[0];
            const month = dateParts[1];
            const day = dateParts[2];
            const url = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${latest.image}.jpg`;
            setEpicImageUrl(url);
          }
          setIsImageLoading(false);
        })
        .catch(() => {
          setEpicImageUrl('https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/1808x1808.jpg');
          setIsImageLoading(false);
        });
    }
  }, [activeChannelId, imageRefreshKey]);

  // Auto-refresh timer for satellite images (every 60s)
  useEffect(() => {
    if (!autoRefresh || activeChannel.type !== 'image') return;
    const interval = setInterval(() => {
      setImageRefreshKey(Date.now());
      setLastRefreshedTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeChannel.type]);

  if (!isOpen) return null;

  const handleManualRefresh = () => {
    audio.playSelect();
    setImageRefreshKey(Date.now());
    setLastRefreshedTime(new Date());
  };

  const handleSwitchChannel = (channelId: string) => {
    audio.playSelect();
    setActiveChannelId(channelId);
    setImageRefreshKey(Date.now());
  };

  // Mini-HUD Picture-in-Picture mode
  if (isMiniMode) {
    return (
      <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 left-2 sm:left-auto w-auto sm:w-96 max-w-[calc(100vw-1rem)] z-40 glass-panel border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.25)] rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-3 font-ui pointer-events-auto">
        {/* Mini Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-cyan-500/30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-display font-bold text-xs text-white truncate max-w-[180px]">
              {activeChannel.name}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleMiniMode && (
              <button 
                onClick={() => {
                  audio.playSelect();
                  onToggleMiniMode();
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                title="Expand to Full Feed"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={() => {
                audio.playHover();
                onClose();
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              title="Close Feed"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Viewport */}
        <div className="relative w-full h-48 sm:h-52 bg-black overflow-hidden flex items-center justify-center">
          {activeChannel.type === 'stream' ? (
            <iframe
              src={activeChannel.streamUrls ? activeChannel.streamUrls[streamBackupIndex] : ''}
              title={activeChannel.name}
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img
              src={activeChannel.id === 'dscovr_epic' && epicImageUrl ? epicImageUrl : `${activeChannel.imageUrl}?t=${imageRefreshKey}`}
              alt={activeChannel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/1808x1808.jpg';
              }}
            />
          )}

          {/* Mini overlay badge */}
          <div className="absolute bottom-2 left-2 pointer-events-none bg-black/75 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
            ALT: {activeChannel.altitudeKm.toLocaleString()} km
          </div>
        </div>
      </div>
    );
  }

  // Standard Modal View
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200 pointer-events-auto">
      <div className="glass-panel border-cyan-500/40 w-full max-w-5xl max-h-[94vh] sm:max-h-[92vh] flex flex-col rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-950/80 border-b border-cyan-500/30 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-hero font-bold text-xs sm:text-base text-white tracking-wider flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="truncate">EARTH OBSERVATION FEEDS</span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                  LIVE
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 truncate hidden xs:block">
                Direct NASA & NOAA Operational Satellite Streams & Geostationary Imagery
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onToggleMiniMode && (
              <button
                onClick={() => {
                  audio.playSelect();
                  onToggleMiniMode();
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-cyan-500/20 transition-all cursor-pointer"
                title="Pop out into Mini Picture-in-Picture"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>PiP MINI</span>
              </button>
            )}

            <button
              onClick={() => {
                audio.playHover();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Navigation Bar */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-900/60 border-b border-slate-800 overflow-x-auto font-ui text-xs no-scrollbar touch-scroll">
          {FEED_CHANNELS.map(ch => {
            const active = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => handleSwitchChannel(ch.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  active 
                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]' 
                    : 'bg-black/30 border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${ch.badgeColor}`}>
                  {ch.badge}
                </span>
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Feed Viewport & Telemetry HUD */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3.5 sm:space-y-4 no-scrollbar touch-scroll">
          
          {/* Feed Screen Container */}
          <div className="relative w-full aspect-video md:aspect-[21/10] bg-black rounded-lg border border-cyan-500/30 overflow-hidden shadow-2xl flex items-center justify-center">
            
            {/* Screen View */}
            {activeChannel.type === 'stream' ? (
              <div className="w-full h-full relative">
                <iframe
                  src={activeChannel.streamUrls ? activeChannel.streamUrls[streamBackupIndex] : ''}
                  title={activeChannel.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                )}
                <img
                  src={activeChannel.id === 'dscovr_epic' && epicImageUrl ? epicImageUrl : `${activeChannel.imageUrl}?t=${imageRefreshKey}`}
                  alt={activeChannel.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/1808x1808.jpg';
                  }}
                />
              </div>
            )}

            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 text-cyan-400/60 font-mono text-[9px] pointer-events-none">
              ┌── REC_FEED // {activeChannel.id.toUpperCase()}
            </div>
            <div className="absolute top-2 right-2 text-cyan-400/60 font-mono text-[9px] pointer-events-none">
              ORBIT_ALT: {activeChannel.altitudeKm.toLocaleString()} KM ──┐
            </div>
            <div className="absolute bottom-2 left-2 text-cyan-400/60 font-mono text-[9px] pointer-events-none">
              └── {activeChannel.resolution}
            </div>
            <div className="absolute bottom-2 right-2 text-cyan-400/60 font-mono text-[9px] pointer-events-none">
              {activeChannel.updateFrequency} ──┘
            </div>
          </div>

          {/* Feed Controls & Telemetry Data Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Feed Status & Source Card */}
            <div className="p-3.5 rounded-lg bg-black/50 border border-cyan-500/20 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-cyan-300 flex items-center gap-1.5">
                  <SatIcon className="w-3.5 h-3.5 text-cyan-400" />
                  SENSOR TELEMETRY
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500 block text-[10px]">OPERATIONAL PLATFORM</span>
                {activeChannel.sourceName}
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500 block text-[10px]">SPECTRAL IMAGER</span>
                {activeChannel.spectralInfo}
              </div>
            </div>

            {/* Orbital Parameters Card */}
            <div className="p-3.5 rounded-lg bg-black/50 border border-cyan-500/20 font-mono text-xs space-y-2">
              <div className="font-display font-bold text-cyan-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                ORBITAL DYNAMICS
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                  <span className="text-slate-500 block text-[9px]">ALTITUDE</span>
                  <span className="text-white font-bold">{activeChannel.altitudeKm.toLocaleString()} km</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                  <span className="text-slate-500 block text-[9px]">VELOCITY</span>
                  <span className="text-cyan-300 font-bold">
                    {activeChannel.altitudeKm < 1000 ? '7.66 km/s' : '3.07 km/s'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-snug">
                {activeChannel.description}
              </div>
            </div>

            {/* Refresh & Stream Source Actions */}
            <div className="p-3.5 rounded-lg bg-black/50 border border-cyan-500/20 font-mono text-xs flex flex-col justify-between space-y-2">
              <div className="font-display font-bold text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  FEED CONTROLS
                </span>
                <span className="text-[10px] text-slate-400">
                  {lastRefreshedTime.toLocaleTimeString()}
                </span>
              </div>

              {activeChannel.type === 'image' ? (
                <div className="space-y-2">
                  <button
                    onClick={handleManualRefresh}
                    className="w-full py-2 px-3 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer font-display text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>REFRESH SATELLITE IMAGE</span>
                  </button>

                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded bg-black border-cyan-500/40 text-cyan-400 focus:ring-0"
                    />
                    <span>Auto-refresh image every 60s</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400">
                    Switch stream channel if primary camera is undergoing TDRS handover or orbital sunset:
                  </div>
                  <div className="flex gap-1.5">
                    {activeChannel.streamUrls?.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          audio.playSelect();
                          setStreamBackupIndex(idx);
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                          streamBackupIndex === idx
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-black/40 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        STREAM {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 pt-1 border-t border-white/5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>All Live Stream Web APIs Authorized</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
