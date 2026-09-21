import * as THREE from 'three';

/**
 * Atmospheric Fresnel outer glow shader
 */
export const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 glowColor;
    uniform float coefficient;
    uniform float power;
    void main() {
      vec3 viewVector = normalize(-vPosition);
      float intensity = pow(coefficient - dot(vNormal, viewVector), power);
      intensity = clamp(intensity, 0.0, 1.0);
      gl_FragColor = vec4(glowColor, intensity * 0.85);
    }
  `
};

/**
 * Photorealistic Real Earth Shader combining NASA Blue Marble day texture,
 * NASA Black Marble night city lights, specular ocean sheen, and limb scattering
 */
export const PhotorealisticEarthShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularTexture;
    uniform vec3 sunDirection;
    uniform vec3 atmosphereColor;
    uniform float nightIntensity;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 worldSunDir = normalize(sunDirection);
      
      // Sun incidence
      float sunDot = dot(worldNormal, worldSunDir);
      
      // Smooth twilight transition between day and night
      float dayFactor = smoothstep(-0.12, 0.15, sunDot);
      float nightFactor = 1.0 - smoothstep(-0.06, 0.12, sunDot);
      
      // Sample NASA textures
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      float specularMap = texture2D(specularTexture, vUv).r;
      
      // Specular ocean sun reflection
      vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
      vec3 reflectDir = reflect(-worldSunDir, worldNormal);
      float specAngle = max(dot(worldViewDir, reflectDir), 0.0);
      float specular = pow(specAngle, 36.0) * specularMap * dayFactor;
      vec3 specularGlint = vec3(1.0, 0.98, 0.94) * specular * 1.4;
      
      // Daylight lighting
      vec3 ambientSpace = vec3(0.06, 0.08, 0.14);
      vec3 dayLit = dayColor.rgb * (max(sunDot, 0.0) * 0.96 + ambientSpace);
      
      // Opposite side (night) celestial ambient terrain & ocean illumination (earthshine & celestial starlight)
      // Provides clear, rich visibility of continents, coastlines, mountain ranges, and ocean water depths on the unlit hemisphere
      vec3 nightAmbientLight = vec3(0.28, 0.38, 0.58); // Luminous starlight & lunar blue-grey tone
      vec3 nightSurface = dayColor.rgb * nightAmbientLight * (0.65 * nightFactor);
      
      // Radiant night city lights (vibrant, warm golden glow that pops brilliantly over the terrain)
      vec3 nightLit = nightColor.rgb * vec3(2.8, 2.2, 1.4) * nightFactor * (nightIntensity * 1.5);
      
      // Combine base surface
      vec3 color = dayLit * dayFactor + nightSurface + nightLit + specularGlint;
      
      // Atmospheric rim scattering along the horizon
      float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
      float rim = pow(fresnel, 3.0);
      float sunLimb = clamp(sunDot * 0.4 + 0.6, 0.25, 1.3);
      vec3 rimGlow = atmosphereColor * rim * 0.65 * sunLimb;
      
      // Luminous night horizon airglow (subtle ionospheric starlight blue rim)
      float nightRim = pow(fresnel, 2.4) * nightFactor * 0.65;
      vec3 nightRimGlow = vec3(0.25, 0.55, 0.95) * nightRim;
      
      color += rimGlow + nightRimGlow;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

/**
 * Creates a procedural high-resolution Earth Day texture
 */
export function createEarthDayTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Ocean base gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a2342'); // Polar deep blue
  oceanGrad.addColorStop(0.3, '#0c356a');
  oceanGrad.addColorStop(0.5, '#0174be'); // Tropical ocean
  oceanGrad.addColorStop(0.7, '#0c356a');
  oceanGrad.addColorStop(1, '#0a2342');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lng to canvas x/y
  const mapCoord = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // Helper to draw continent polygons
  const drawLandmass = (
    coords: Array<[number, number]>, 
    fillColor = '#2d5a27', 
    strokeColor = '#1e3f1a'
  ) => {
    ctx.beginPath();
    coords.forEach(([lat, lng], idx) => {
      const [x, y] = mapCoord(lat, lng);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // North America
  drawLandmass([
    [70, -165], [72, -130], [60, -135], [50, -125], [38, -123], [30, -115],
    [24, -110], [18, -104], [15, -92], [22, -97], [29, -95], [25, -80],
    [32, -80], [42, -70], [45, -60], [55, -55], [60, -65], [75, -80],
    [70, -120], [70, -165]
  ], '#3a5a40');

  // South America
  drawLandmass([
    [12, -75], [8, -60], [4, -50], [-5, -35], [-15, -38], [-23, -42],
    [-35, -55], [-45, -65], [-55, -68], [-50, -75], [-35, -72], [-20, -70],
    [-5, -80], [10, -78], [12, -75]
  ], '#2d6a4f');

  // Europe
  drawLandmass([
    [71, 28], [60, 5], [50, -5], [43, -9], [36, -5], [37, 10], [40, 25],
    [45, 35], [55, 30], [65, 35], [70, 30], [71, 28]
  ], '#40916c');

  // Africa
  drawLandmass([
    [36, -5], [37, 10], [32, 32], [12, 44], [12, 51], [2, 45], [-12, 40],
    [-25, 32], [-34, 18], [-33, 27], [-20, 12], [-5, 10], [5, 2],
    [5, -10], [15, -17], [25, -15], [35, -5], [36, -5]
  ], '#d4a373'); // Sahara / savannah tones

  // Asia
  drawLandmass([
    [75, 100], [70, 180], [60, 160], [50, 140], [40, 125], [30, 122],
    [22, 115], [10, 105], [5, 100], [20, 90], [25, 80], [15, 75],
    [25, 60], [30, 50], [40, 50], [55, 60], [65, 70], [75, 100]
  ], '#52b788');

  // Australia
  drawLandmass([
    [-11, 130], [-12, 143], [-25, 153], [-37, 150], [-38, 140],
    [-32, 115], [-22, 113], [-15, 125], [-11, 130]
  ], '#e76f51'); // Red outback

  // Antarctica (polar ice)
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, height * 0.88, width, height * 0.12);

  // Greenland & Arctic Ice
  drawLandmass([[83, -30], [80, -20], [70, -25], [60, -45], [70, -55], [83, -30]], '#f0f9ff');

  // Add terrain noise & mountain ridges
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 0; i < 3000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 3 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates a procedural Earth Night city lights texture
 */
export function createEarthNightTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pitch black base
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, width, height);

  const mapCoord = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  const drawCityCluster = (lat: number, lng: number, radius: number, density: number) => {
    const [cx, cy] = mapCoord(lat, lng);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255, 235, 150, 0.95)');
    grad.addColorStop(0.3, 'rgba(255, 180, 50, 0.5)');
    grad.addColorStop(0.7, 'rgba(255, 120, 20, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Speckled intense lights
    ctx.fillStyle = '#fffbeb';
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 1.5) * radius * 0.8;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      ctx.fillRect(px, py, 1.5, 1.5);
    }
  };

  // Major global megalopolises
  // US East Coast & Great Lakes
  drawCityCluster(40.7, -74.0, 35, 45); // New York
  drawCityCluster(42.3, -71.0, 20, 20); // Boston
  drawCityCluster(38.9, -77.0, 25, 25); // DC
  drawCityCluster(41.8, -87.6, 28, 30); // Chicago
  drawCityCluster(34.0, -118.2, 35, 40); // Los Angeles
  drawCityCluster(37.7, -122.4, 25, 25); // San Francisco
  drawCityCluster(29.7, -95.3, 24, 25); // Houston
  drawCityCluster(33.7, -84.3, 22, 20); // Atlanta

  // Europe
  drawCityCluster(51.5, -0.1, 32, 40); // London
  drawCityCluster(48.8, 2.3, 30, 35); // Paris
  drawCityCluster(52.5, 13.4, 25, 25); // Berlin
  drawCityCluster(50.8, 4.3, 35, 40); // Benelux high density
  drawCityCluster(41.9, 12.5, 20, 20); // Rome
  drawCityCluster(40.4, -3.7, 22, 22); // Madrid
  drawCityCluster(55.7, 37.6, 28, 30); // Moscow

  // Asia
  drawCityCluster(35.6, 139.7, 45, 60); // Tokyo Kanto plain
  drawCityCluster(34.6, 135.5, 30, 35); // Osaka
  drawCityCluster(31.2, 121.4, 40, 50); // Shanghai Yangtze Delta
  drawCityCluster(39.9, 116.4, 38, 45); // Beijing
  drawCityCluster(22.3, 114.1, 35, 40); // Pearl River Delta / HK
  drawCityCluster(37.5, 126.9, 32, 40); // Seoul
  drawCityCluster(28.6, 77.2, 35, 45); // Delhi
  drawCityCluster(19.0, 72.8, 35, 45); // Mumbai
  drawCityCluster(12.9, 77.5, 25, 30); // Bangalore
  drawCityCluster(1.3, 103.8, 20, 25); // Singapore

  // Middle East & Africa & South America
  drawCityCluster(25.2, 55.3, 24, 30); // Dubai
  drawCityCluster(30.0, 31.2, 25, 30); // Cairo (Nile river ribbon)
  drawCityCluster(-23.5, -46.6, 35, 40); // Sao Paulo
  drawCityCluster(-34.6, -58.3, 26, 30); // Buenos Aires
  drawCityCluster(-26.2, 28.0, 24, 25); // Johannesburg
  drawCityCluster(-33.8, 151.2, 25, 30); // Sydney

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates a procedural atmospheric swirling cloud texture
 */
export function createEarthCloudTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
  ctx.fillRect(0, 0, width, height);

  // Cloud bands and tropical storm spirals
  for (let b = 0; b < 18; b++) {
    const cy = (b / 18) * height + (Math.sin(b) * 40);
    const alpha = 0.25 + Math.sin(b * 1.5) * 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

    for (let c = 0; c < 20; c++) {
      const cx = (c / 20) * width + Math.sin(c * 2 + b) * 80;
      const rx = 80 + Math.random() * 120;
      const ry = 25 + Math.random() * 40;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, Math.sin(c) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw tropical cyclone swirls
  const drawCyclone = (x: number, y: number, r: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 12;
    for (let a = 0; a < Math.PI * 6; a += 0.2) {
      const dist = (a / (Math.PI * 6)) * r;
      const px = x + Math.cos(a) * dist;
      const py = y + Math.sin(a) * dist * 0.6;
      if (a === 0) ctx.beginPath();
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  };

  drawCyclone(width * 0.25, height * 0.35, 110);
  drawCyclone(width * 0.72, height * 0.4, 130);
  drawCyclone(width * 0.55, height * 0.65, 90);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
