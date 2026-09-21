import React, { useRef, useEffect, useState } from 'react';
import { 
  SatelliteData, 
  SatelliteTelemetry, 
  FilterOptions, 
  TimeState, 
  GroundStation 
} from '../../types/satellite';
import { 
  propagateSatellite, 
  generateGroundTrack 
} from '../../services/orbitalEngine';
import { audio } from '../../services/audioService';

interface Map2DViewProps {
  satellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (sat: SatelliteData | null) => void;
  filters: FilterOptions;
  timeState: TimeState;
  groundStations: GroundStation[];
}

export const Map2DView: React.FC<Map2DViewProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  filters,
  timeState,
  groundStations
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSat, setHoveredSat] = useState<{ sat: SatelliteData; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const earthImg = new Image();
    earthImg.src = '/textures/earth_day.jpg';

    let animId: number;

    const render2D = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Draw real NASA satellite Earth imagery or fallback
      if (earthImg.complete && earthImg.naturalWidth > 0) {
        ctx.drawImage(earthImg, 0, 0, width, height);
        // Subtle dark tint to preserve aerospace HUD readability
        ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#030816';
        ctx.fillRect(0, 0, width, height);
      }

      // Coordinate converter helper
      const mapX = (lng: number) => ((lng + 180) / 360) * width;
      const mapY = (lat: number) => ((90 - lat) / 180) * height;

      // Draw latitude / longitude grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;

      // Longitude lines
      for (let lng = -180; lng <= 180; lng += 30) {
        const x = mapX(lng);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(`${lng}°`, x + 3, height - 6);
      }

      // Latitude lines & Equator
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = mapY(lat);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = lat === 0 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = lat === 0 ? 1.5 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(`${lat}°`, 6, y - 4);
      }

      // Draw Day/Night Terminator Curve
      const date = timeState.currentSimTime;
      const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
      const subSolarLng = -((hours / 24) * 360 - 180);
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 10) {
        const lng = (x / width) * 360 - 180;
        const deltaLng = (lng - subSolarLng) * (Math.PI / 180);
        // Solar declination approximation for September equinox
        const dec = 0.05 * Math.sin((date.getMonth() * 30 + date.getDate()) * (Math.PI / 180));
        const termLat = -Math.atan(Math.cos(deltaLng) / Math.tan(dec || 0.001)) * (180 / Math.PI);
        const y = mapY(Math.max(-85, Math.min(85, termLat)));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.fill();
      ctx.restore();

      // Draw Ground Stations
      if (filters.showGroundStations) {
        groundStations.forEach(st => {
          const sx = mapX(st.lng);
          const sy = mapY(st.lat);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = '9px "JetBrains Mono"';
          ctx.fillText(st.name.split(' ')[0], sx + 6, sy + 3);
        });
      }

      // Draw Selected Satellite Ground Track & Footprint
      if (selectedSatellite) {
        const telem = propagateSatellite(selectedSatellite, timeState.currentSimTime);
        if (telem) {
          const sx = mapX(telem.lng);
          const sy = mapY(telem.lat);

          // Sensor coverage circle/ellipse
          if (filters.showFootprints) {
            const radDeg = (telem.footprintRadiusKm / 6371.0) * (180 / Math.PI);
            const rx = (radDeg / 360) * width;
            const ry = (radDeg / 180) * height;

            ctx.beginPath();
            ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Ground track curve
          if (filters.showGroundTracks) {
            const track = generateGroundTrack(selectedSatellite, timeState.currentSimTime, 70);
            ctx.beginPath();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);

            track.forEach((pt, idx) => {
              const px = mapX(pt.lng);
              const py = mapY(pt.lat);
              if (idx === 0) ctx.moveTo(px, py);
              else {
                // Prevent wrapping line across map border
                if (Math.abs(pt.lng - track[idx - 1].lng) < 180) {
                  ctx.lineTo(px, py);
                } else {
                  ctx.moveTo(px, py);
                }
              }
            });
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Active Ground station communication laser links
          if (filters.showCommsLinks && telem.inRangeGroundStations) {
            telem.inRangeGroundStations.forEach(stId => {
              const station = groundStations.find(g => g.id === stId);
              if (station) {
                const stx = mapX(station.lng);
                const sty = mapY(station.lat);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(stx, sty);
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            });
          }
        }
      }

      // Draw All Filtered Satellites
      satellites.forEach(sat => {
        const telem = propagateSatellite(sat, timeState.currentSimTime);
        if (!telem) return;

        const x = mapX(telem.lng);
        const y = mapY(telem.lat);
        const isSelected = selectedSatellite?.id === sat.id;

        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 6 : 3, 0, Math.PI * 2);

        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (sat.status === 'DEBRIS' || sat.objectType === 'DEBRIS') {
          ctx.fillStyle = '#ef4444';
        } else if (sat.category === 'SPACE_STATION') {
          ctx.fillStyle = '#10b981';
        } else if (sat.category === 'NAVIGATION') {
          ctx.fillStyle = '#3b82f6';
        } else if (sat.category === 'WEATHER') {
          ctx.fillStyle = '#f59e0b';
        } else {
          ctx.fillStyle = '#00f0ff';
        }
        ctx.fill();

        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px "Orbitron"';
          ctx.fillText(sat.name, x + 8, y + 4);
        }
      });

      animId = requestAnimationFrame(render2D);
    };

    render2D();
    return () => cancelAnimationFrame(animId);
  }, [satellites, selectedSatellite, filters, timeState, groundStations]);

  // Click & Hover Handling on 2D map
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const mapX = (lng: number) => ((lng + 180) / 360) * width;
    const mapY = (lat: number) => ((90 - lat) / 180) * height;

    let closest: SatelliteData | null = null;
    let minD = 18;

    satellites.forEach(sat => {
      const telem = propagateSatellite(sat, timeState.currentSimTime);
      if (telem) {
        const sx = mapX(telem.lng);
        const sy = mapY(telem.lat);
        const d = Math.hypot(sx - mouseX, sy - mouseY);
        if (d < minD) {
          minD = d;
          closest = sat;
        }
      }
    });

    if (closest) {
      audio.playSelect();
      onSelectSatellite(closest);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const mapX = (lng: number) => ((lng + 180) / 360) * width;
    const mapY = (lat: number) => ((90 - lat) / 180) * height;

    let closest: SatelliteData | null = null;
    let minD = 15;

    satellites.forEach(sat => {
      const telem = propagateSatellite(sat, timeState.currentSimTime);
      if (telem) {
        const sx = mapX(telem.lng);
        const sy = mapY(telem.lat);
        const d = Math.hypot(sx - mouseX, sy - mouseY);
        if (d < minD) {
          minD = d;
          closest = sat;
        }
      }
    });

    if (closest) {
      setHoveredSat({ sat: closest, x: mouseX + 15, y: mouseY + 15 });
      canvas.style.cursor = 'pointer';
    } else {
      setHoveredSat(null);
      canvas.style.cursor = 'crosshair';
    }
  };

  return (
    <div className="relative w-full h-full select-none bg-slate-950 flex items-center justify-center p-4" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={1600}
        height={800}
        className="w-full h-full max-h-[85vh] object-contain rounded-lg border border-cyan-500/20 shadow-2xl"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSat(null)}
      />

      {/* 2D Mode HUD legend */}
      <div className="absolute top-8 left-8 glass-panel p-3 text-xs space-y-1">
        <div className="font-display font-bold text-cyan-400 text-[13px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          EQUIRECTANGULAR COMMAND MAP (2D)
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          WGS-84 Projection • Solar Terminator • Sensor Footprints
        </div>
      </div>

      {hoveredSat && (
        <div
          className="absolute z-20 pointer-events-none glass-panel p-2 shadow-2xl"
          style={{
            left: `${hoveredSat.x}px`,
            top: `${hoveredSat.y}px`
          }}
        >
          <div className="font-display font-semibold text-xs text-white">
            {hoveredSat.sat.name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {hoveredSat.sat.operator} • #{hoveredSat.sat.id}
          </div>
        </div>
      )}
    </div>
  );
};
