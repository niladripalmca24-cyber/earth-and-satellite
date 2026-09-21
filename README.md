# 🛰️ EarthOrbit 3D — Interactive 3D Earth & Satellite Intelligence Explorer

[![Render Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_2.0-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

**EarthOrbit 3D** is a next-generation aerospace telemetry visualization platform combining photorealistic 3D Earth rendering, real-time SGP4 orbital ephemeris propagation, authentic spacecraft flight photography, and real-life live video and geostationary satellite feeds from NASA and NOAA.

---

## 🌟 Key Features
live demo link https://earth-and-satellite-1.onrender.com

### 1. 🌍 Photorealistic 3D Earth & Illuminated Night Hemisphere
- **NASA Blue Marble & Black Marble Day/Night Shaders**: Twilight terminator blending with specular ocean sun glints and dynamic Rayleigh/Fresnel atmospheric horizon limb scattering.
- **Enhanced Dark-Side Illumination**: Celestial starlight and earthshine fill (`PhotorealisticEarthShader`) ensuring continents, ocean water bodies, and mountain ranges on the unlit hemisphere remain clearly visible alongside radiant 2.8x boosted golden city lights.
- **Opposing Starlight Fill Light**: Directional starlight fill and starlight emissive reflection on volumetric cloud formations.

### 2. 🔴 Real-Life Earth Feeds & Picture-in-Picture (PiP)
- **NASA ISS Live HD Earth Stream**: Continuous high-definition live video feeds streaming directly from the International Space Station's external cameras orbiting Earth at 27,600 km/h.
- **NOAA GOES-East (GOES-16) Full Disk**: Operational real-time 1808×1808 multispectral GeoColor imagery from 35,786 km in geostationary orbit.
- **NOAA GOES-West (GOES-18) Full Disk**: Real-time Pacific Ocean, Hawaii, and Western North America weather and cyclone monitoring.
- **NASA DSCOVR EPIC**: Deep space full-disk sunlit Earth imagery from 1,000,000 miles away at the L1 Lagrange point.
- **JMA Himawari-9**: Real-time Western Pacific, Asia, and Australia weather monitoring.
- **Picture-in-Picture (PiP) Mini Mode**: Dock live video feeds into a floating corner HUD while freely exploring the 3D globe.

### 3. 📸 Deep Dive Dossier with Authentic Satellite Photography
- **Authentic Flight Imagery**: High-resolution space photographs for ISS, Hubble Space Telescope, China Tiangong Space Station, SWOT Radar Satellite, Landsat 8/9, GPS Block III, and Starlink.
- **Dual-Mode Inspector**: Toggle between interactive 3D WebGL wireframe schematics and authentic high-resolution orbital photos inside the spacecraft card.
- **Dedicated Photometry Tab & 4K Lightbox**: Full-screen expandable image viewer with capture dates, optical instrument telemetry, and official source credits (NASA, ESA, USSF, SpaceX, CMSA).

### 4. 🛰️ Comprehensive 88-Object Orbital Fleet
- **Orbit Regimes**: Low Earth Orbit (LEO), Medium Earth Orbit (MEO), Geostationary Orbit (GEO), and Highly Elliptical Orbit (HEO).
- **Categories**: Space Stations, Earth Observation, Astronomy & Science, Navigation (GPS, Galileo, BeiDou, GLONASS), Communications (Starlink, OneWeb), Weather, and Debris.
- **SGP4 Propagation Engine**: Accurate real-time calculation of latitude, longitude, altitude, velocity, sub-satellite footprint coverage, and ground track predictions.

### 5. 🎨 Professional Color Grading & Aesthetics
- 5 Cinematic Profiles:
  - **ACES Filmic**: HDR reference color balance with crisp realism.
  - **Deep Space Cinema**: Interstellar cool blue contrast and deep shadows.
  - **Infrared Recon**: High-contrast thermal sensor palette.
  - **Orbital Dawn**: Golden hour twilight atmospheric scattering.
  - **Cyberpunk Matrix**: Vibrant synthwave neon glow.
- Modern aerospace typography with **Plus Jakarta Sans**, **Chakra Petch**, **Orbitron**, and **JetBrains Mono**.

### 6. ⏱️ 4D Orbital Time Machine
- Interactive timeline controller with speeds from -1000x reverse to +1000x fast-forward.
- Real-time UTC chronometer and Julian Date (`JD`) calculator.

---

## 🚀 Render Live Deployment Requirements & Process

Deploying **EarthOrbit 3D** to Render is 100% free and takes less than 2 minutes as a **Static Site**.

### 📋 Live Deployment Requirements
| Parameter | Requirement / Value |
| :--- | :--- |
| **Service Type** | **Static Site** |
| **Node Version** | `18.x` or `20.x` or higher |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Single Page Application (SPA) Rewrite** | `/*` &rarr; `/index.html` (HTTP status: `200`) |
| **Custom Domain** | Supported with automatic free SSL/TLS certificates |

---

### Option A: 1-Click Deployment with `render.yaml` (Recommended)
This repository includes a pre-configured [`render.yaml`](render.yaml) blueprint file.

1. Fork or push this repository to GitHub:
   ```bash
   https://github.com/niladripalmca24-cyber/earth-and-satellite
   ```
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top-right corner and select **Blueprint**.
4. Connect your GitHub repository `earth-and-satellite`.
5. Render will automatically read `render.yaml` and configure:
   - Name: `earthorbit-3d`
   - Environment: `static`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - SPA Rewrite: `/* -> /index.html`
6. Click **Apply**. Render will install dependencies, build the production bundle, and launch your live site with a public HTTPS URL (`https://earthorbit-3d.onrender.com`).

---

### Option B: Manual Setup via Render Dashboard
If configuring manually:
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Static Site**.
3. Connect `niladripalmca24-cyber/earth-and-satellite`.
4. Configure the settings:
   - **Name**: `earthorbit-3d`
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `.` (leave blank)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click **Advanced** &rarr; **Add Rewrite / Redirect Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) version 18.0.0 or higher
- [npm](https://www.npmjs.com/) version 9.0.0 or higher

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/niladripalmca24-cyber/earth-and-satellite.git

# 2. Enter project directory
cd earth-and-satellite

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
# Type check and generate production bundle in /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Technology Stack
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) with custom GLSL shaders
- **Orbital Physics**: [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4 / SDP4 propagator)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom glassmorphism tokens
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Synthesis**: Web Audio API procedural synthesis

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
Satellite TLE ephemeris data courtesy of CelesTrak and Space-Track.org.
Orbital photography and satellite imagery courtesy of NASA, NOAA, ESA, USGS, and SpaceX.
