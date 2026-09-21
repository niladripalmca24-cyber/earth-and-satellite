# 🚀 Render Deployment Guide — EarthOrbit 3D

This guide walks you step-by-step through deploying **EarthOrbit 3D** to [Render](https://render.com) as a high-performance **Static Site**.

---

## 1. Requirements Checklist

Before deploying, ensure you meet the following requirements:

| Requirement | Specification |
| :--- | :--- |
| **Hosting Platform** | [Render](https://render.com) |
| **Service Category** | **Static Site** (Free Tier eligible) |
| **Node.js Environment** | Node `18.0.0` or higher (`engines.node` in `package.json`) |
| **Repository** | `https://github.com/niladripalmca24-cyber/earth-and-satellite` |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Routing** | SPA Rewrite Rule (`/*` &rarr; `/index.html`) |

---

## 2. Deployment Methods

### Method 1: Infrastructure as Code with `render.yaml` (Recommended)

This repository includes a [`render.yaml`](render.yaml) file configured for instant deployment.

1. **Push your code** to GitHub:
   ```bash
   git push -u origin main
   ```
2. Open the [Render Dashboard](https://dashboard.render.com).
3. Click the blue **New +** button in the upper right.
4. Select **Blueprint**.
5. Connect the GitHub repository `niladripalmca24-cyber/earth-and-satellite`.
6. Render will automatically parse `render.yaml`:
   - Service Type: `Static Site`
   - Build Command: `npm install && npm run build`
   - Publish Path: `./dist`
   - Rewrite Rule: `/*` &rarr; `/index.html`
   - Permissions Policies for WebGL & Audio
7. Click **Apply**.
8. Render will trigger an automated build. Once complete, your site will be live at `https://earthorbit-3d.onrender.com`.

---

### Method 2: Manual Dashboard Creation

If you prefer to configure manually via the Render web interface:

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Static Site**.
3. Under **Connect a repository**, choose `niladripalmca24-cyber/earth-and-satellite`. (If not visible, click *Configure GitHub App* and grant access to the repo).
4. Fill in the deployment details:
   - **Name**: `earthorbit-3d` (or custom name)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Expand the **Advanced** section:
   - **Auto-Deploy**: `Yes` (automatically redeploys whenever you push commits to `main`)
6. Scroll down to **Redirects / Rewrites** and click **Add Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - *(This ensures direct URL navigation and client-side routing resolve correctly)*.
7. Click **Create Static Site**.

---

## 3. Post-Deployment Verification

Once the build finishes and status displays **Live**:

1. **Verify 3D Earth & Night Side**:
   - Open your Render URL (e.g. `https://earthorbit-3d.onrender.com`).
   - Rotate the 3D globe to the dark hemisphere.
   - Verify that continents, oceans, and city lights are visible.
2. **Verify Live Earth Feeds**:
   - Click the **LIVE EARTH FEED** button in the top HUD.
   - Verify the NASA ISS Live HD video player streams properly and geostationary NOAA GOES feeds render.
3. **Verify Deep Dive Satellite Imagery**:
   - Open a satellite dossier (e.g. ISS, Hubble, SWOT).
   - Toggle to **REAL PHOTO** and verify high-resolution flight images render.
   - Click the photo to test the 4K lightbox expand.

---

## 4. Custom Domain Configuration (Optional)

To attach a custom domain (e.g., `orbit.yourdomain.com`):

1. Go to your Static Site in the Render Dashboard.
2. Click **Settings** in the left sidebar.
3. Scroll to **Custom Domains** and click **Add Custom Domain**.
4. Enter your domain name and follow Render's instructions to add a `CNAME` record in your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).
5. Render will automatically issue and renew a free Let's Encrypt SSL/TLS certificate.

---

## 5. Troubleshooting

- **Issue: 404 on page refresh**
  - *Fix*: Ensure the Rewrite rule is set: `Type: Rewrite`, `Source: /*`, `Destination: /index.html`.
- **Issue: Build out of memory**
  - *Fix*: The build uses Vite which is extremely lightweight (~5 seconds build time, ~50MB RAM). No extra memory allocation is required.
- **Issue: Textures or images failing to load**
  - *Fix*: All local textures and satellite photography are stored in `/public`, which Vite automatically copies to `/dist` root during `npm run build`.
