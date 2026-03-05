<p align="center">
  <img src="INTERACTIVE SHAPES.png" alt="GEOFORM Preview" width="100%" />
</p>

<h1 align="center">GEOFORM — Interactive 3D Art Gallery</h1>

<p align="center">
  <strong>Five shapes. Infinite dimensions.</strong><br>
  An immersive 3D shape gallery built with <b>Three.js</b>, featuring interactive geometries, real-time material switching, WebGL analytics, and ambient spatial audio.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-r128-black?logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Web%20Audio-API-orange" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Vanilla-JS%20%2F%20CSS-yellow" alt="Vanilla JS/CSS" />
  <img src="https://img.shields.io/badge/Course-HC1%20102L-blue" alt="HC1 102L" />
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| **5 Interactive 3D Shapes** | Box, Sphere, Torus, Cone, Octahedron — each in its own WebGL scene |
| **Material Switching** | Standard, Wireframe, Phong, Lambert — swap in real-time per shape |
| **Scene Presets** | Gallery, Space, Studio lighting environments |
| **Drag & Spin** | Click to spin, drag to move, long-press for orbit camera controls |
| **WebGL Stats Panel** | Live FPS, render time, draw calls, triangles, geometries, textures — with sparkline graphs |
| **Ambient Spatial Audio** | Web Audio API–driven space ambience: drone pads, sub-bass pulse, hi-hat shimmer, melodic arp |
| **Scroll-Reactive Marquee** | Shape marquee that accelerates with scroll velocity |
| **Smooth Parallax** | Lerp-based parallax across all sections with eased in/out motion |
| **Custom Cursor** | Dot + ring follower with hover scaling and blend-mode effects |
| **Scroll Animations** | Staggered reveals, divider expansions, tag glows, spotlight sway |
| **Star This Repo Popup** | Hover the GitHub button in credits to reveal a clickable repo link |

---

## 🛠 Tech Stack

- **Three.js r128** — WebGL 3D rendering (CDN)
- **Web Audio API** — Procedural ambient music & SFX
- **Vanilla JavaScript** — No frameworks, no build tools
- **CSS3** — Custom properties, `clamp()`, `clip-path`, keyframe animations, intersection observers
- **Google Fonts** — Bebas Neue, Space Mono, Syne

---

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/katto-1204/hci-interactiveshapes.git
   cd hci-interactiveshapes
   ```

2. **Open `index.html`** in any modern browser  
   No build step needed — it's pure HTML/CSS/JS.

3. **Enable sound** by clicking the sound toggle (bottom-right) after entering the gallery.

---

## 📁 Project Structure

```
├── index.html      # Main page — loader, instructions, landing, gallery, credits
├── styles.css      # All styling, animations, responsive design
├── script.js       # Audio, cursor, Three.js scenes, parallax, interactions
└── README.md
```

---

## 🎮 Controls

| Action | Effect |
|---|---|
| **Scroll** | Navigate sections, trigger parallax, accelerate marquee |
| **Click shape** | Toggle spin |
| **Drag shape** | Move it around the canvas |
| **Long-press shape** | Enter orbit camera mode |
| **TAB** | Toggle WebGL stats panel |
| **Material / Scene buttons** | Switch materials & lighting per shape |
| **Sound button** | Toggle ambient audio |
| **Hover GitHub button** | Reveal "Star This Repo" popup |

---

## 📋 Assignment Context

> **HC1 102L** — Interactive 3D Shape Gallery with Three.js  
> **Instructor:** Sir Maubert Fred Yretarino  
> **Points:** 40 pts  

### Requirements Met
- ✅ Scene setup with camera and renderer  
- ✅ 5 different geometry types (Box, Sphere, Torus, Cone, Octahedron)  
- ✅ 4 material types (Standard, Wireframe, Phong, Lambert)  
- ✅ Ambient and directional lighting  
- ✅ Hover effects — emissive glow + scale on mouseover  
- ✅ Click to spin individual shapes  
- ✅ Theme: Abstract Art Gallery  

---

## 👩‍💻 Author

**Catherine Arnado**  
Developer · Designer · Dreamer

- 🌐 [Portfolio](https://kattojsx.vercel.app/)
- 📧 catherine.arnado@hcdc.edu.ph
- 🐙 [GitHub](https://github.com/katto-1204)

---

<p align="center"><sub>Built with ☕ and Three.js</sub></p>
