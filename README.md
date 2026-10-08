# 53-Upscaler-Image

> **Upscale • Gradient • Grain • Blur**  
> *A professional, modular 4-in-1 image processing web application built with React, TypeScript, Tailwind CSS, Node.js, Express, and Sharp.*

---

## 🌟 Overview

**Image Processing Studio** is a desktop-first, mobile-responsive image workstation engineered for designers, content creators, photographers, and stock-image artists. Built with a clean, modern aesthetic, it provides four high-performance tools in a modular architecture:

1. **Image Upscale 4K / 8K**: Super-resolution scaling up to 4K UHD (3840×2160) and 8K UHD (7680×4320) with Lanczos3 high-order convolution, micro-contrast sharpening, unsharp masking, and provider abstraction (Neural AI vs Local Engine).
2. **Image to Gradient**: Extracts dominant palettes (up to 8 colors) and synthesizes Linear, Radial, Angular, Mesh, Liquid, Soft Blur, and Abstract gradients with an automatic **10 Coherent Variations** generator.
3. **Noise / Film Grain**: Authentic analog film grain based on parabolic midtone physics (Kodak 35mm), digital sensor ISO noise, and chromatic RGB variations with real-time seed randomization.
4. **Image to Blur**: Gaussian, directional motion velocity, radial vortex, zoom blur, and background subject blur with an interactive manual brush & eraser mask editor.
5. **Print-Ready Density Standard (72 to 300 PPI)**: Embeds selectable density metadata (72 PPI for Web, 150 PPI for standard printing, 300 PPI for commercial Ultra HD print) into EXIF/JFIF/PNG metadata headers.

---

## 🏗️ Architecture

```
53-Upscaler-Image/
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # UniversalUploader, Comparison, Export, Queue
│   │   │   ├── layout/           # Header, Sidebar, MobileNav
│   │   │   └── tools/            # Upscale, Gradient, Noise, Blur Workspaces
│   │   ├── pages/                # Dashboard, History, Settings, About
│   │   ├── registry/             # Modular ToolRegistry (extensible for future tools)
│   │   ├── services/             # Typed API Client
│   │   └── hooks/                # useTheme, useHistory, useKeyboardShortcuts
│   └── vite.config.ts
├── backend/                      # Node.js + Express + TypeScript + Sharp
│   ├── src/
│   │   ├── controllers/          # Upload, Upscale, Gradient, Noise, Blur, Export
│   │   ├── middleware/           # File validation (50MB, MIME), Error handler
│   │   ├── processors/
│   │   │   ├── upscale/          # IUpscaleProvider, LocalUpscaler, AIUpscalerAPI
│   │   │   ├── gradient/         # ColorExtractor, GradientGenerator
│   │   │   ├── noise/            # NoiseProcessor (35mm film physics)
│   │   │   └── blur/             # BlurProcessor (Gaussian, Motion, Mask)
│   │   ├── services/             # FileService, QueueService
│   │   └── server.ts
├── shared/                       # Synchronized TypeScript interfaces & types
├── uploads/                      # Temporary storage for uploaded images
├── outputs/                      # Processed high-resolution exports
└── package.json                  # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation

Install all backend and frontend dependencies:

```bash
# In backend directory
cd backend
npm install

# In frontend directory
cd ../frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Contents of `.env`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=50

# Optional Neural AI Provider (Real-ESRGAN / Replicate)
AI_UPSCALE_ENDPOINT=
AI_UPSCALE_API_KEY=
AI_UPSCALE_MODEL=real-esrgan-4x-plus
```

> **Note on AI Provider**: If no API key is specified, the application automatically uses the high-performance local Lanczos3 + Unsharp Masking engine and transparently displays:
> *"AI provider not configured — using high-quality local upscaling."*

### 3. Running in Development Mode

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Starts on http://localhost:5173 with API proxying
```

Open `http://localhost:5173` in your browser.

---

## 🎨 Feature Breakdown

### 1. Image Upscale 4K / 8K
- **Scale Options**: 2X (QHD), 4X (UHD), 4K (~3840×2160), 8K (~7680×4320).
- **Aspect Ratio Preservation**: Automatically fits the canvas boundary without distortion or stretching.
- **Controls**: Detail Enhancement, Sharpness & Unsharp Masking, Noise Reduction Pre-filter, Face Tone Enhancement toggle.
- **Print Density (PPI)**: Selectable from 72 to 300 PPI.

### 2. Image to Gradient
- **Automatic Dominant Color Extraction**: K-means / quantization clustering extracting Primary, Secondary, Accent, Dark, and Light colors up to 8 stops.
- **Manual Color Editing**: Hex picker with add/remove color stops.
- **Modes**: Linear, Radial, Angular, Mesh, Liquid, Soft Blur, and Abstract.
- **10 Variations Generator**: 1-click generation of 10 distinct, visually coherent color permutations and angles.

### 3. Noise / Film Grain
- **Profiles**: Kodak 35mm Analog, Subtle Silk Fine, Medium Grain, Heavy Grit, Monochrome Silver Halide, RGB Color Noise, Digital Sensor ISO, Texture Grain.
- **Authentic Physics**: Parabolic midtone weighting where grain concentrates in midtones and softly rolls off in extreme shadows and specular highlights.
- **Controls**: Amount, Particle Size (1.0–4.0px), Intensity, Contrast, Opacity, Preserve Original Colors, Randomize Seed.

### 4. Image to Blur
- **Modes**: Gaussian, Directional Motion Blur (with angle & distance), Radial Vortex, Zoom Blur, Soft Mist, Lens Aperture Bloom, and Background Blur.
- **Manual Mask Editor**: Interactive overlay with Brush (keep subject sharp) and Eraser (paint background to blur) with custom brush radius.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Uploads image (multipart `image` field, max 50MB, returns metadata with PPI) |
| `DELETE` | `/api/file/:id` | Deletes uploaded or processed file |
| `POST` | `/api/upscale` | Processes 2x/4x/4K/8K upscale with provider abstraction |
| `POST` | `/api/gradient/extract-colors` | Extracts dominant palette (up to 8 colors) |
| `POST` | `/api/gradient` | Synthesizes gradient background or overlay |
| `POST` | `/api/gradient/variations` | Returns 10 coherent color variations |
| `POST` | `/api/noise` | Applies analog film grain or digital noise |
| `POST` | `/api/blur` | Applies optical blur filters with optional manual mask |
| `POST` | `/api/export` | High-definition multi-format export with 72–300 PPI metadata |
| `GET` | `/api/job/:id` | Checks background queue job progress |
| `GET` | `/api/health` | Health check endpoint |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Undo last parameter adjustment |
| `Ctrl + Y` / `Cmd + Y` | Redo adjustment |
| `Ctrl + S` / `Cmd + S` | Download processed image |

---

## 🖨️ PPI / DPI Standards Explained

- **72 PPI**: Standard digital screen, web graphics, and mobile apps.
- **150 PPI**: Standard office printing, presentations, and flyers.
- **300 PPI**: Commercial Ultra HD printing, fine art photography, and magazine publishing.
- *Image Processing Studio injects the exact density value directly into the output file header using Sharp's metadata pipeline.*

---

## 🛡️ License

MIT License. Built for production excellence.
