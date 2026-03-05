const isTouchDevice = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

let audioCtx = null;
let soundEnabled = false;
let masterGain = null;
const droneOscs = [];

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function startSpaceAmbience() {
  try {
    const ctx = getAudioCtx();

    function makePad(freq, vol, speed) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      filter.Q.value = 1;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
      // Slow fade in
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);
      // LFO tremolo
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = speed;
      lfoGain.gain.value = vol * 0.2;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      droneOscs.push(osc, lfo);
    }

    // 2. Sub bass pulse (square wave, very filtered, 4/4 rhythm feel)
    function makeSubPulse() {
      const freq = 55; // A1
      function pulse() {
        if (!soundEnabled) return;
        try {
          const ctx2 = getAudioCtx();
          const osc = ctx2.createOscillator();
          const gain = ctx2.createGain();
          const filt = ctx2.createBiquadFilter();
          filt.type = "lowpass";
          filt.frequency.value = 180;
          osc.type = "square";
          osc.frequency.value = freq;
          gain.gain.value = 0;
          osc.connect(filt);
          filt.connect(gain);
          gain.connect(masterGain);
          osc.start();
          gain.gain.linearRampToValueAtTime(0.04, ctx2.currentTime + 0.03);
          gain.gain.setTargetAtTime(0.001, ctx2.currentTime + 0.18, 0.05);
          osc.stop(ctx2.currentTime + 0.5);
          setTimeout(pulse, 480); // ~125 BPM quarter note feel
        } catch (e) {}
      }
      setTimeout(pulse, 800);
    }

    // 3. Hi-hat shimmer (noise burst, very subtle)
    function makeHiHat() {
      function hat() {
        if (!soundEnabled) return;
        try {
          const ctx2 = getAudioCtx();
          const buf = ctx2.createBuffer(
            1,
            ctx2.sampleRate * 0.05,
            ctx2.sampleRate
          );
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const src = ctx2.createBufferSource();
          src.buffer = buf;
          const gain = ctx2.createGain();
          const filt = ctx2.createBiquadFilter();
          filt.type = "highpass";
          filt.frequency.value = 8000;
          src.connect(filt);
          filt.connect(gain);
          gain.connect(masterGain);
          gain.gain.value = 0;
          gain.gain.linearRampToValueAtTime(0.018, ctx2.currentTime + 0.003);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx2.currentTime + 0.05
          );
          src.start();
          src.stop(ctx2.currentTime + 0.06);
          // Offbeat pattern: 8th notes
          const nextTime = Math.random() > 0.5 ? 240 : 480;
          setTimeout(hat, nextTime);
        } catch (e) {}
      }
      setTimeout(hat, 1200);
    }

    // 4. Soft melodic arp (pentatonic, slow, gentle)
    const pentatonic = [220, 261.6, 293.7, 349.2, 392, 440, 523.3];
    let arpIdx = 0;
    function makeArp() {
      function note() {
        if (!soundEnabled) return;
        try {
          const ctx2 = getAudioCtx();
          const f = pentatonic[arpIdx % pentatonic.length];
          arpIdx++;
          const osc = ctx2.createOscillator();
          const gain = ctx2.createGain();
          const filt = ctx2.createBiquadFilter();
          filt.type = "bandpass";
          filt.frequency.value = f * 2;
          filt.Q.value = 3;
          osc.type = "triangle";
          osc.frequency.value = f;
          gain.gain.value = 0;
          osc.connect(filt);
          filt.connect(gain);
          gain.connect(masterGain);
          osc.start();
          gain.gain.linearRampToValueAtTime(0.025, ctx2.currentTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.6);
          osc.stop(ctx2.currentTime + 0.7);
          setTimeout(note, 480 + (Math.random() > 0.7 ? 480 : 0));
        } catch (e) {}
      }
      setTimeout(note, 600);
    }

    // 5. Deep ambient pad chords
    makePad(55, 0.03, 0.07); // A1 root
    makePad(82.4, 0.02, 0.05); // E2
    makePad(110, 0.025, 0.09); // A2
    makePad(164.8, 0.015, 0.06); // E3

    makeSubPulse();
    makeHiHat();
    makeArp();
  } catch (e) {
    console.warn("Audio init failed:", e);
  }
}

/* ---- SFX ---- */
function playTone(freq, type, dur, vol) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = type || "sine";
    osc.frequency.value = freq || 440;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol || 0.06, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + (dur || 0.15)
    );
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (dur || 0.15) + 0.05);
  } catch (e) {}
}

function playClick() {
  playTone(440, "triangle", 0.06, 0.08);
  setTimeout(() => playTone(660, "sine", 0.08, 0.04), 30);
}
function playHover() {
  playTone(880 + Math.random() * 220, "sine", 0.04, 0.02);
}
function playReveal() {
  [330, 440, 550, 660].forEach((f, i) =>
    setTimeout(() => playTone(f, "triangle", 0.18, 0.04), i * 60)
  );
}
function playOrbit() {
  playTone(220, "triangle", 0.25, 0.05);
  setTimeout(() => playTone(330, "sine", 0.2, 0.03), 80);
}

/* ============================================================
   SOUND TOGGLE BUTTON
============================================================ */
const soundBtn = document.getElementById("sound-btn");
const iconOn = document.getElementById("sound-icon-on");
const iconOff = document.getElementById("sound-icon-off");

function setSoundState(enabled) {
  soundEnabled = enabled;
  if (enabled) {
    iconOn.style.display = "";
    iconOff.style.display = "none";
    soundBtn.classList.remove("sound-off");
    if (masterGain)
      masterGain.gain.setTargetAtTime(1, getAudioCtx().currentTime, 0.3);
  } else {
    iconOn.style.display = "none";
    iconOff.style.display = "";
    soundBtn.classList.add("sound-off");
    if (masterGain)
      masterGain.gain.setTargetAtTime(0, getAudioCtx().currentTime, 0.3);
  }
}

soundBtn.addEventListener("click", () => {
  setSoundState(!soundEnabled);
});

/* ============================================================
   CURSOR
============================================================ */
const cur = document.getElementById("cursor");
const ring = document.getElementById("cursor-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;

if (!isTouchDevice()) {
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    cur.style.left = mx - 6 + "px";
    cur.style.top = my - 6 + "px";
  });
  (function animCursor() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx - 20 + "px";
    ring.style.top = ry - 20 + "px";
    requestAnimationFrame(animCursor);
  })();
  document.querySelectorAll("a, button, .btn").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.style.transform = "scale(1.8)";
      ring.style.borderColor = "rgba(255,77,0,.8)";
      playHover();
    });
    el.addEventListener("mouseleave", () => {
      ring.style.transform = "scale(1)";
      ring.style.borderColor = "rgba(255,77,0,.5)";
    });
    el.addEventListener("click", playClick);
  });
}

/* ============================================================
   LOADER
============================================================ */
const loaderBar = document.getElementById("loader-bar");
const loaderPct = document.getElementById("loader-pct");
let pct = 0;
const loadInt = setInterval(() => {
  pct += Math.random() * 8 + 2;
  if (pct >= 100) {
    pct = 100;
    clearInterval(loadInt);
    setTimeout(showInstructions, 400);
  }
  loaderBar.style.width = pct + "%";
  loaderPct.textContent = Math.floor(pct) + "%";
}, 80);

function showInstructions() {
  document.getElementById("loader").classList.add("hidden");
  document.getElementById("instructions-screen").classList.add("show");
}

document.getElementById("inst-enter").addEventListener("click", () => {
  document.getElementById("instructions-screen").classList.remove("show");
  document.getElementById("instructions-screen").classList.add("hidden");
  soundEnabled = true;
  setSoundState(true);
  startSpaceAmbience();
  playReveal();
});

/* ============================================================
   TAB TOAST — hide after first WebGL open
============================================================ */
const tabToast = document.getElementById("tab-toast");

/* ============================================================
   WEBGL PANEL + LIVE STATS
============================================================ */
const webglPanel = document.getElementById("webgl-panel");

// Renderer registry — individual scenes register here
const registeredRenderers = [];

function registerRenderer(renderer) {
  registeredRenderers.push(renderer);
}

// Sparkline buffers
const sparkData = { fps: [], ms: [], calls: [], tris: [], geo: [], tex: [] };
const SPARK_MAX = 30;

function pushSpark(key, val) {
  sparkData[key].push(val);
  if (sparkData[key].length > SPARK_MAX) sparkData[key].shift();
}

function drawSparkline(canvasId, data, color) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.offsetWidth || 120;
  const h = 32;
  c.width = w;
  c.height = h;
  ctx.clearRect(0, 0, w, h);
  if (data.length < 2) return;
  const max = Math.max(...data) || 1;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  data.forEach((v, i) => {
    const x = (i / (SPARK_MAX - 1)) * w;
    const y = h - (v / max) * (h - 2) - 1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Fill under line
  ctx.lineTo(((data.length - 1) / (SPARK_MAX - 1)) * w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = color.replace(")", ", 0.08)").replace("rgb", "rgba");
  ctx.fill();
}

// FPS graph canvas
let fpsHistory = [];
const FPS_MAX_POINTS = 80;

function drawFpsGraph(fps) {
  fpsHistory.push(fps);
  if (fpsHistory.length > FPS_MAX_POINTS) fpsHistory.shift();
  const c = document.getElementById("fps-graph");
  if (!c || !webglPanel.classList.contains("open")) return;
  const ctx = c.getContext("2d");
  const w = c.offsetWidth || 700;
  const h = 80;
  c.width = w;
  c.height = h;
  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  [20, 40, 60].forEach((y) => {
    const py = h - (y / 70) * h;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "9px Space Mono, monospace";
    ctx.fillText(y + "", 4, py - 3);
  });

  if (fpsHistory.length < 2) return;
  // Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,77,0,0.9)");
  grad.addColorStop(1, "rgba(255,77,0,0.1)");

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,77,0,0.9)";
  ctx.lineWidth = 1.5;
  fpsHistory.forEach((v, i) => {
    const x = (i / (FPS_MAX_POINTS - 1)) * w;
    const y = h - Math.min(v / 65, 1) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.lineTo(((fpsHistory.length - 1) / (FPS_MAX_POINTS - 1)) * w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

// Stats update loop
let lastTime = performance.now();
let frameCount = 0;
let currentFps = 60;

function updateWebGLStats() {
  requestAnimationFrame(updateWebGLStats);
  frameCount++;
  const now = performance.now();
  const delta = now - lastTime;

  if (delta >= 500) {
    currentFps = Math.round(frameCount / (delta / 1000));
    frameCount = 0;
    lastTime = now;

    const renderMs = (delta / (currentFps || 1)).toFixed(1);

    // Aggregate info from all registered renderers
    let totalCalls = 0,
      totalTris = 0,
      totalGeo = 0,
      totalTex = 0;
    registeredRenderers.forEach((r) => {
      try {
        const info = r.info;
        totalCalls += info.render.calls || 0;
        totalTris += info.render.triangles || 0;
        totalGeo += info.memory.geometries || 0;
        totalTex += info.memory.textures || 0;
      } catch (e) {}
    });

    // Push sparklines
    pushSpark("fps", currentFps);
    pushSpark("ms", parseFloat(renderMs));
    pushSpark("calls", totalCalls);
    pushSpark("tris", Math.round(totalTris / 1000));
    pushSpark("geo", totalGeo);
    pushSpark("tex", totalTex);

    if (webglPanel.classList.contains("open")) {
      const el = (id) => document.getElementById(id);
      el("wgl-fps").textContent = currentFps;
      el("wgl-ms").innerHTML = renderMs + " <span>ms</span>";
      el("wgl-calls").textContent = totalCalls;
      el("wgl-tris").textContent = (totalTris / 1000).toFixed(1) + "k";
      el("wgl-geo").textContent = totalGeo;
      el("wgl-tex").textContent = totalTex;

      drawSparkline("spark-fps", sparkData.fps, "rgb(255,77,0)");
      drawSparkline("spark-ms", sparkData.ms, "rgb(0,229,200)");
      drawSparkline("spark-calls", sparkData.calls, "rgb(255,215,0)");
      drawSparkline("spark-tris", sparkData.tris, "rgb(255,45,120)");
      drawSparkline("spark-geo", sparkData.geo, "rgb(123,47,255)");
      drawSparkline("spark-tex", sparkData.tex, "rgb(255,255,255)");
      drawFpsGraph(currentFps);
    }
  }
}
updateWebGLStats();

function openWebGL() {
  webglPanel.classList.add("open");
  tabToast.classList.add("hidden");
  playReveal();
}
function closeWebGL() {
  webglPanel.classList.remove("open");
  playClick();
}

document.getElementById("webgl-btn").addEventListener("click", openWebGL);
document.getElementById("webgl-close").addEventListener("click", closeWebGL);
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    webglPanel.classList.contains("open") ? closeWebGL() : openWebGL();
  }
  if (e.key === "Escape") closeWebGL();
});

/* ============================================================
   SCROLL PROGRESS
============================================================ */
window.addEventListener(
  "scroll",
  () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0)
      document.getElementById("progress").style.width =
        (window.scrollY / h) * 100 + "%";
  },
  { passive: true }
);

/* ============================================================
   MARQUEE — scroll-reactive speed boost
============================================================ */
(function initMarqueeScroll() {
  const track = document.querySelector(".marquee-track");
  if (!track) return;
  const BASE = 10; // default duration in seconds
  const FAST = 2; // fastest duration when scrolling hard
  let lastScroll = 0,
    scrollVel = 0,
    currentDur = BASE,
    rafId = 0;
  let decayTimer = null;

  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScroll);
      scrollVel = Math.min(dy, 120); // cap
      lastScroll = window.scrollY;
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        scrollVel = 0;
      }, 120);
    },
    { passive: true }
  );

  function tick() {
    requestAnimationFrame(tick);
    const targetDur = BASE - (scrollVel / 120) * (BASE - FAST);
    currentDur += (targetDur - currentDur) * 0.12;
    track.style.animationDuration = currentDur.toFixed(2) + "s";
  }
  tick();
})();

/* ============================================================
   INTERSECTION OBSERVER — ROW REVEAL
============================================================ */
const rowObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        playReveal();
      }
    });
  },
  { threshold: 0.2 }
);
document.querySelectorAll(".shape-row").forEach((r) => rowObserver.observe(r));

/* ============================================================
   CREDITS REVEAL
============================================================ */
const creditsObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        playReveal();
      }
    });
  },
  { threshold: 0.3 }
);
const cName = document.querySelector(".credits-name");
if (cName) creditsObs.observe(cName);

// Credits section staggered entrance
const creditsSectionObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.15 }
);
const creditsEl = document.getElementById("s-credits");
if (creditsEl) creditsSectionObs.observe(creditsEl);

// Section dividers expand on scroll
const dividerObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.5 }
);
document
  .querySelectorAll(".section-divider")
  .forEach((d) => dividerObs.observe(d));

/* ============================================================
   SCROLL PARALLAX — smooth lerp
============================================================ */
(function initSectionParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const landingContent = document.querySelector(".landing-content");
  const rows = Array.from(document.querySelectorAll(".shape-row"));
  const creditsBg = document.querySelector(".credits-bg");
  const creditsDeco = document.querySelector(".credits-deco");

  let landingY = 0,
    landingTarget = 0;
  const rowInfoY = rows.map(() => ({ curr: 0, target: 0 }));
  const rowCanvasY = rows.map(() => ({ curr: 0, target: 0 }));
  let creditsBgY = 0,
    creditsBgTarget = 0;
  let creditsDecoY = 0,
    creditsDecoTarget = 0;
  const LERP = 0.07;

  function updateTargets() {
    const scrollY = window.scrollY || 0;
    const viewportH = window.innerHeight || 1;
    landingTarget = scrollY * 0.3;
    rows.forEach((row, idx) => {
      const rect = row.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - viewportH / 2;
      const normalized = Math.max(-1, Math.min(1, centerOffset / viewportH));
      const dir = idx % 2 === 0 ? 1 : -1;
      rowInfoY[idx].target = normalized * -40 * dir;
      rowCanvasY[idx].target = normalized * 28 * dir;
    });
    creditsBgTarget = scrollY * -0.06;
    creditsDecoTarget = scrollY * -0.12;
  }

  function tick() {
    requestAnimationFrame(tick);
    landingY += (landingTarget - landingY) * LERP;
    if (landingContent)
      landingContent.style.transform = `translate3d(0, ${landingY.toFixed(
        1
      )}px, 0)`;
    rows.forEach((row, idx) => {
      rowInfoY[idx].curr += (rowInfoY[idx].target - rowInfoY[idx].curr) * LERP;
      rowCanvasY[idx].curr +=
        (rowCanvasY[idx].target - rowCanvasY[idx].curr) * LERP;
      const info = row.querySelector(".shape-info");
      const canvasWrap = row.querySelector(".shape-canvas-wrap");
      if (info)
        info.style.transform = `translate3d(0, ${rowInfoY[idx].curr.toFixed(
          1
        )}px, 0)`;
      if (canvasWrap)
        canvasWrap.style.transform = `translate3d(0, ${rowCanvasY[
          idx
        ].curr.toFixed(1)}px, 0)`;
    });
    creditsBgY += (creditsBgTarget - creditsBgY) * LERP;
    creditsDecoY += (creditsDecoTarget - creditsDecoY) * LERP;
    if (creditsBg)
      creditsBg.style.transform = `translate3d(0, ${creditsBgY.toFixed(
        1
      )}px, 0)`;
    if (creditsDeco)
      creditsDeco.style.transform = `translate3d(-50%, ${creditsDecoY.toFixed(
        1
      )}px, 0)`;
  }

  window.addEventListener("scroll", updateTargets, { passive: true });
  window.addEventListener("resize", updateTargets);
  updateTargets();
  tick();
})();

/* ============================================================
   MATERIAL FACTORY
============================================================ */
function makeMaterial(type, color, emissive) {
  const em = emissive || 0x000000;
  switch (type) {
    case "wireframe":
      return new THREE.MeshBasicMaterial({ color, wireframe: true });
    case "phong":
      return new THREE.MeshPhongMaterial({
        color,
        shininess: 120,
        specular: 0x888888,
        emissive: em
      });
    case "lambert":
      return new THREE.MeshLambertMaterial({ color, emissive: em });
    default:
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.4,
        roughness: 0.3,
        emissive: em
      });
  }
}

/* ============================================================
   SCENE LIGHTING PRESETS
============================================================ */
function applySceneLighting(scene, preset) {
  const toRemove = [];
  scene.traverse((obj) => {
    if (obj.isLight) toRemove.push(obj);
  });
  toRemove.forEach((l) => scene.remove(l));
  if (preset === "space") {
    scene.background = new THREE.Color(0x000510);
    scene.add(new THREE.AmbientLight(0x000820, 0.3));
    const dir = new THREE.DirectionalLight(0x4488ff, 1.5);
    dir.position.set(-5, 10, 3);
    scene.add(dir);
    const rim = new THREE.PointLight(0x7b2fff, 2, 15);
    rim.position.set(3, -3, -2);
    scene.add(rim);
    const spot = new THREE.SpotLight(0xffffff, 2, 20, Math.PI / 8, 0.5);
    spot.position.set(0, 8, 2);
    scene.add(spot);
    scene.add(spot.target);
  } else if (preset === "studio") {
    scene.background = new THREE.Color(0x111111);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(5, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-5, 0, 5);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xffffff, 0.3);
    back.position.set(0, -5, -5);
    scene.add(back);
  } else {
    scene.background = null;
    const spot = new THREE.SpotLight(0xffffff, 4, 20, Math.PI / 6, 0.3);
    spot.position.set(0, 8, 2);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);
    const rim = new THREE.PointLight(0x334466, 1, 10);
    rim.position.set(-3, -2, 2);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x111122, 0.5));
  }
}

/* ============================================================
   POINTER HELPERS
============================================================ */
function getPointerFromEvent(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return {
    x: ((src.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((src.clientY - rect.top) / rect.height) * 2 + 1,
    rawX: src.clientX,
    rawY: src.clientY
  };
}

/* ============================================================
   THREE.JS — LANDING SCENE
============================================================ */
(function initLanding() {
  const canvas = document.getElementById("three-canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  registerRenderer(renderer);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 8);

  scene.add(new THREE.AmbientLight(0x222244, 0.8));
  const dir = new THREE.DirectionalLight(0xff6600, 2);
  dir.position.set(5, 8, 5);
  scene.add(dir);
  const fill = new THREE.PointLight(0x00e5c8, 1.5, 20);
  fill.position.set(-5, 3, 3);
  scene.add(fill);
  const back = new THREE.PointLight(0x7b2fff, 1, 15);
  back.position.set(0, -5, -3);
  scene.add(back);

  const shapeData = [
    {
      geo: new THREE.BoxGeometry(1.2, 1.2, 1.2),
      color: 0xff4d00,
      pos: [-3.5, 1, 0],
      mat: "standard"
    },
    {
      geo: new THREE.SphereGeometry(0.8, 32, 32),
      color: 0x00e5c8,
      pos: [-1.2, -0.8, 1],
      mat: "phong"
    },
    {
      geo: new THREE.TorusGeometry(0.7, 0.28, 16, 60),
      color: 0xffd700,
      pos: [1.2, 1.2, -1],
      mat: "standard"
    },
    {
      geo: new THREE.ConeGeometry(0.7, 1.4, 32),
      color: 0xff2d78,
      pos: [3.5, -0.5, 0],
      mat: "lambert"
    },
    {
      geo: new THREE.OctahedronGeometry(0.9),
      color: 0x7b2fff,
      pos: [0.2, 0.3, 2],
      mat: "phong"
    }
  ];

  const shapes = [],
    spinning = new Set(),
    hovered = new Set();
  const raycaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();
  let isDragging = false,
    dragMesh = null;
  const dragPlane = new THREE.Plane(),
    dragOffset = new THREE.Vector3();
  let pointerStart = { x: 0, y: 0 };

  shapeData.forEach((c) => {
    let m;
    if (c.mat === "phong")
      m = new THREE.MeshPhongMaterial({
        color: c.color,
        shininess: 100,
        specular: 0x444444
      });
    else if (c.mat === "lambert")
      m = new THREE.MeshLambertMaterial({ color: c.color });
    else
      m = new THREE.MeshStandardMaterial({
        color: c.color,
        metalness: 0.3,
        roughness: 0.4
      });
    const mesh = new THREE.Mesh(c.geo, m);
    mesh.position.set(...c.pos);
    mesh.userData = { origPos: [...c.pos], dragging: false };
    scene.add(mesh);
    shapes.push(mesh);
  });

  canvas.addEventListener("pointerdown", (e) => {
    const p = getPointerFromEvent(e, canvas);
    pointerStart = { x: p.rawX, y: p.rawY };
    mouse.set(p.x, p.y);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(shapes);
    if (hits.length) {
      isDragging = true;
      dragMesh = hits[0].object;
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()).negate(),
        hits[0].point
      );
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, pt);
      dragOffset.copy(pt).sub(dragMesh.position);
      canvas.style.cursor = "grabbing";
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = getPointerFromEvent(e, canvas);
    mouse.set(p.x, p.y);
    if (isDragging && dragMesh) {
      raycaster.setFromCamera(mouse, camera);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, pt);
      dragMesh.position.copy(pt.sub(dragOffset));
      dragMesh.userData.dragging = true;
      return;
    }
    if (!isTouchDevice()) {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(shapes);
      const hitSet = new Set(hits.map((h) => h.object));
      shapes.forEach((m) => {
        if (hitSet.has(m) && !hovered.has(m)) {
          hovered.add(m);
          if (m.material.emissive) m.material.emissive.setHex(0x332200);
          playHover();
          canvas.style.cursor = "grab";
        } else if (!hitSet.has(m) && hovered.has(m)) {
          hovered.delete(m);
          if (m.material.emissive) m.material.emissive.setHex(0x000000);
          canvas.style.cursor = "none";
        }
      });
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (isDragging && dragMesh) {
      const p = getPointerFromEvent(e, canvas);
      if (
        Math.abs(p.rawX - pointerStart.x) < 8 &&
        Math.abs(p.rawY - pointerStart.y) < 8
      ) {
        if (spinning.has(dragMesh)) spinning.delete(dragMesh);
        else spinning.add(dragMesh);
        playClick();
      }
      dragMesh.userData.dragging = false;
      dragMesh = null;
    }
    isDragging = false;
    canvas.style.cursor = isTouchDevice() ? "auto" : "none";
  });
  canvas.addEventListener("pointerleave", () => {
    if (dragMesh) dragMesh.userData.dragging = false;
    isDragging = false;
    dragMesh = null;
  });

  let targetX = 0,
    targetY = 0,
    currentX = 0,
    currentY = 0;
  if (!isTouchDevice()) {
    document.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;
    camera.position.x = currentX * 1.5;
    camera.position.y = currentY * 1.0;
    camera.lookAt(0, 0, 0);
    shapes.forEach((m, i) => {
      if (!m.userData.dragging)
        m.position.y = m.userData.origPos[1] + Math.sin(t + i * 1.2) * 0.3;
      if (spinning.has(m)) {
        m.rotation.x += 0.04;
        m.rotation.y += 0.06;
      } else {
        m.rotation.x += 0.003;
        m.rotation.y += 0.005;
      }
      const ts = hovered.has(m) ? 1.15 : 1;
      m.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.1);
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
})();

/* ============================================================
   THREE.JS — INDIVIDUAL SHAPE SCENES
============================================================ */
function createShapeScene(canvasWrap, shapeIdx) {
  const canvas = document.createElement("canvas");
  canvasWrap.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  registerRenderer(renderer);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  applySceneLighting(scene, "gallery");

  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(120 * 3);
  for (let i = 0; i < 360; i++) starPos[i] = (Math.random() - 0.5) * 16;
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.4
    })
  );
  stars.visible = false;
  scene.add(stars);

  const shapeConfigs = [
    {
      geo: new THREE.BoxGeometry(2, 2, 2, 2, 2, 2),
      color: 0xff4d00,
      defaultMat: "standard",
      emissive: 0x330e00
    },
    {
      geo: new THREE.SphereGeometry(1.3, 64, 64),
      color: 0x00e5c8,
      defaultMat: "phong",
      emissive: 0x003330
    },
    {
      geo: new THREE.TorusGeometry(1.1, 0.42, 24, 100),
      color: 0xffd700,
      defaultMat: "wireframe",
      emissive: 0x332a00
    },
    {
      geo: new THREE.ConeGeometry(1.1, 2.2, 64),
      color: 0xff2d78,
      defaultMat: "lambert",
      emissive: 0x33003a
    },
    {
      geo: new THREE.OctahedronGeometry(1.4, 0),
      color: 0x7b2fff,
      defaultMat: "phong",
      emissive: 0x16003a
    }
  ];

  const cfg = shapeConfigs[shapeIdx];
  let mat = makeMaterial(cfg.defaultMat, cfg.color, cfg.emissive);
  const mesh = new THREE.Mesh(cfg.geo, mat);
  scene.add(mesh);

  const orbitOverlay = document.createElement("div");
  orbitOverlay.className = "orbit-overlay";
  orbitOverlay.innerHTML =
    '<div class="orbit-label">ORBIT MODE — DRAG TO ROTATE CAMERA</div>';
  canvasWrap.appendChild(orbitOverlay);

  let isSpinning = false,
    isHovered = false,
    isOrbitMode = false,
    isOrbitDragging = false,
    isDragging = false;
  let t = 0,
    longPressTimer = null;
  const LONG_PRESS = 500;
  let pointerStart = { x: 0, y: 0 },
    lastPointer = { x: 0, y: 0 };
  const dragPlane = new THREE.Plane(),
    dragOffset = new THREE.Vector3();
  let camTheta = 0,
    camPhi = Math.PI / 2,
    camRadius = 5;
  const raycaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();

  function onPointerDown(e) {
    e.preventDefault();
    const p = getPointerFromEvent(e, canvas);
    pointerStart = { x: p.rawX, y: p.rawY };
    lastPointer = { x: p.rawX, y: p.rawY };
    mouse.set(p.x, p.y);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(mesh);
    longPressTimer = setTimeout(() => {
      isOrbitMode = true;
      isOrbitDragging = true;
      orbitOverlay.classList.add("active");
      playOrbit();
      canvas.style.cursor = "crosshair";
    }, LONG_PRESS);
    if (hits.length) {
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()).negate(),
        hits[0].point
      );
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, pt);
      dragOffset.copy(pt).sub(mesh.position);
      isDragging = true;
      canvas.style.cursor = "grabbing";
    }
  }

  function onPointerMove(e) {
    e.preventDefault();
    const p = getPointerFromEvent(e, canvas);
    const dx = p.rawX - lastPointer.x,
      dy = p.rawY - lastPointer.y;
    lastPointer = { x: p.rawX, y: p.rawY };
    if (
      Math.abs(p.rawX - pointerStart.x) > 6 ||
      Math.abs(p.rawY - pointerStart.y) > 6
    ) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (isOrbitMode && isOrbitDragging) {
      camTheta -= dx * 0.012;
      camPhi -= dy * 0.012;
      camPhi = Math.max(0.2, Math.min(Math.PI - 0.2, camPhi));
      camera.position.x = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
      camera.position.y = camRadius * Math.cos(camPhi);
      camera.position.z = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
      camera.lookAt(0, 0, 0);
      return;
    }
    if (isDragging) {
      mouse.set(p.x, p.y);
      raycaster.setFromCamera(mouse, camera);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, pt);
      mesh.position.copy(pt.sub(dragOffset));
      mesh.position.clamp(
        new THREE.Vector3(-2.5, -2, -2.5),
        new THREE.Vector3(2.5, 2, 2.5)
      );
      return;
    }
    if (!isTouchDevice()) {
      mouse.set(p.x, p.y);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(mesh);
      if (hits.length && !isHovered) {
        isHovered = true;
        if (mat.emissive) mat.emissive.setHex(cfg.emissive || 0x111111);
        if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 2;
        playHover();
        canvas.style.cursor = "grab";
      } else if (!hits.length && isHovered) {
        isHovered = false;
        if (mat.emissive) mat.emissive.setHex(cfg.emissive || 0x000000);
        if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 1;
        canvas.style.cursor = "none";
      }
    }
  }

  function onPointerUp(e) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    if (isOrbitMode) {
      isOrbitMode = false;
      isOrbitDragging = false;
      orbitOverlay.classList.remove("active");
      canvas.style.cursor = isTouchDevice() ? "auto" : "grab";
      playClick();
    } else if (isDragging) {
      const p = getPointerFromEvent(e, canvas);
      if (
        Math.abs(p.rawX - pointerStart.x) < 8 &&
        Math.abs(p.rawY - pointerStart.y) < 8
      ) {
        isSpinning = !isSpinning;
        playClick();
      }
      mesh.position.set(0, 0, 0);
    }
    isDragging = false;
    isOrbitDragging = false;
  }

  function onPointerLeave() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    isDragging = false;
    isOrbitDragging = false;
    isHovered = false;
    if (isOrbitMode) {
      isOrbitMode = false;
      orbitOverlay.classList.remove("active");
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  canvas.addEventListener("pointercancel", onPointerLeave, { passive: true });

  // Controls are now in shape-info — find by data-idx
  const ctrl = document.querySelector(
    `.shape-controls[data-idx="${shapeIdx}"]`
  );
  if (ctrl) {
    ctrl.querySelectorAll(".mat-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const newMat = makeMaterial(btn.dataset.mat, cfg.color, cfg.emissive);
        mesh.material = newMat;
        mat = newMat;
        ctrl
          .querySelectorAll(".mat-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        playClick();
      });
    });
    ctrl.querySelectorAll(".scene-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        applySceneLighting(scene, btn.dataset.scene);
        stars.visible = btn.dataset.scene === "space";
        ctrl
          .querySelectorAll(".scene-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        playReveal();
      });
    });
  }

  let scrollRot = 0;
  window.addEventListener(
    "scroll",
    () => {
      const rect = canvasWrap.getBoundingClientRect();
      scrollRot =
        ((rect.top + rect.height / 2 - window.innerHeight / 2) /
          window.innerHeight) *
        Math.PI *
        2;
    },
    { passive: true }
  );

  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;
    if (!isOrbitMode) {
      const spd = isSpinning ? 0.04 : 0.006;
      mesh.rotation.y += spd;
      mesh.rotation.x += spd * 0.4;
    }
    const ts = isHovered ? 1.12 : 1;
    mesh.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.08);
    if (!isDragging && !isOrbitMode)
      mesh.position.y += (Math.sin(t) * 0.18 - mesh.position.y) * 0.025;
    if (!isOrbitMode) mesh.rotation.x += scrollRot * 0.001;
    stars.rotation.y += 0.0004;
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const w = canvasWrap.clientWidth || 1,
      h = canvasWrap.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(canvasWrap);
  const iw = canvasWrap.clientWidth || 600,
    ih = canvasWrap.clientHeight || 600;
  camera.aspect = iw / ih;
  camera.updateProjectionMatrix();
  renderer.setSize(iw, ih);
}

document
  .querySelectorAll(".shape-canvas-wrap")
  .forEach((wrap, i) => createShapeScene(wrap, i));

/* ============================================================
   HOVER STAR-REPO POPUP (Credits GitHub button)
============================================================ */
(function initRepoStarHoverPopup() {
  const githubBtn = document.querySelector(
    '.credits-btns a[href="https://github.com/katto-1204"]'
  );
  if (!githubBtn) return;

  const repoUrl = "https://github.com/katto-1204/hci-interactiveshapes";
  const popup = document.createElement("a");
  popup.className = "repo-star-hover-popup";
  popup.href = repoUrl;
  popup.target = "_blank";
  popup.rel = "noopener";
  popup.innerHTML = `
    <span>Star This Repo</span>
    <svg class="repo-star-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  `;
  document.body.appendChild(popup);

  let hideTimer = null;

  function positionPopup() {
    const btnRect = githubBtn.getBoundingClientRect();
    const popW = popup.offsetWidth || 160;
    let left = btnRect.left + btnRect.width / 2 - popW / 2;
    left = Math.max(8, Math.min(window.innerWidth - popW - 8, left));
    popup.style.left = left + "px";
    popup.style.top = btnRect.bottom + 10 + "px";
  }

  function showPopup() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    positionPopup();
    popup.classList.add("show");
  }

  function hidePopupSoon() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      popup.classList.remove("show");
      hideTimer = null;
    }, 220);
  }

  githubBtn.addEventListener("mouseenter", showPopup);
  githubBtn.addEventListener("mouseleave", hidePopupSoon);
  githubBtn.addEventListener("focus", showPopup);
  githubBtn.addEventListener("blur", hidePopupSoon);
  popup.addEventListener("mouseenter", showPopup);
  popup.addEventListener("mouseleave", hidePopupSoon);
  window.addEventListener("resize", () => {
    if (popup.classList.contains("show")) positionPopup();
  });
  window.addEventListener(
    "scroll",
    () => {
      if (popup.classList.contains("show")) positionPopup();
    },
    { passive: true }
  );
})();

/* ============================================================
   GEOMETRIC PLAYGROUND
============================================================ */
(function initPlayground() {
  const overlay = document.getElementById("playground-overlay");
  const openBtn = document.getElementById("playground-btn");
  const closeBtn = document.getElementById("playground-close");
  const canvas = document.getElementById("playground-canvas");
  const infoEl = document.getElementById("pg-info");
  const hudLeft = document.getElementById("pg-hud-left");
  const sceneLabel = document.getElementById("pg-scene-label");
  if (!overlay || !canvas) return;

  let initialized = false;
  let pgRenderer,
    pgScene,
    pgCamera,
    pgControls,
    pgShapes = [],
    pgRaycaster,
    pgMouse;
  let selectedShape = null,
    pgSpinning = new Set(),
    pgHovered = new Set();
  let pgDragging = false,
    pgDragMesh = null,
    pgDragPlane,
    pgDragOffset;
  let pgPointerStart = { x: 0, y: 0 };
  let pgT = 0,
    pgAnimId = null;
  let currentMat = "standard",
    currentSceneId = "ember";
  let pgLights = {}; // named lights
  let extraLights = []; // user-added lights
  let pgGridMain, pgGridSub; // grid refs for scene swaps

  /* ---------- SFX helpers ---------- */
  function sfxSelect() {
    playTone(520, "triangle", 0.08, 0.07);
    setTimeout(() => playTone(780, "sine", 0.1, 0.04), 40);
  }
  function sfxSpin() {
    playTone(660, "sine", 0.12, 0.05);
    setTimeout(() => playTone(880, "triangle", 0.1, 0.03), 50);
  }
  function sfxMaterial() {
    [440, 550, 660].forEach((f, i) =>
      setTimeout(() => playTone(f, "sine", 0.08, 0.04), i * 35)
    );
  }
  function sfxCamera() {
    playTone(330, "triangle", 0.15, 0.05);
    setTimeout(() => playTone(440, "sine", 0.12, 0.03), 70);
  }
  function sfxScene() {
    [220, 330, 440, 550, 660].forEach((f, i) =>
      setTimeout(() => playTone(f, "triangle", 0.14, 0.04), i * 50)
    );
  }
  function sfxLight() {
    playTone(700, "sine", 0.1, 0.04);
    setTimeout(() => playTone(900, "triangle", 0.08, 0.03), 40);
  }
  function sfxZoomIn() {
    playTone(400, "sine", 0.15, 0.04);
    setTimeout(() => playTone(600, "sine", 0.12, 0.03), 60);
  }

  /* ---------- Scene presets ---------- */
  const scenes = {
    ember: {
      label: "Ember",
      bg: 0x0a0806,
      fog: 0x0a0806,
      fogDensity: 0.03,
      gridA: 0xff4d00,
      gridB: 0x1a0f08,
      gridC: 0x402010,
      gridD: 0x1a0c04,
      ambient: [0x2a1a0e, 0.9],
      dir: [0xffeedd, 0.9],
      point: [0xff4d00, 1.4],
      accent: [0xff8c00, 1],
      spot: [0xfff0dd, 1.5]
    },
    void: {
      label: "Void",
      bg: 0x020204,
      fog: 0x020204,
      fogDensity: 0.04,
      gridA: 0x7b2fff,
      gridB: 0x0a0618,
      gridC: 0x1a1030,
      gridD: 0x080414,
      ambient: [0x0e0a1e, 0.6],
      dir: [0x8866cc, 0.7],
      point: [0x7b2fff, 1.6],
      accent: [0xaa44ff, 1.2],
      spot: [0xddccff, 1.2]
    },
    arctic: {
      label: "Arctic",
      bg: 0x0a0f14,
      fog: 0x0a0f14,
      fogDensity: 0.025,
      gridA: 0x00e5c8,
      gridB: 0x081418,
      gridC: 0x0a2030,
      gridD: 0x060e14,
      ambient: [0x1a2a3a, 1.0],
      dir: [0xddeeff, 1.0],
      point: [0x00e5c8, 1.3],
      accent: [0x00bfff, 1.0],
      spot: [0xffffff, 1.4]
    },
    neon: {
      label: "Neon",
      bg: 0x06020a,
      fog: 0x06020a,
      fogDensity: 0.03,
      gridA: 0xff2d78,
      gridB: 0x140610,
      gridC: 0x300a1c,
      gridD: 0x100408,
      ambient: [0x1a0a14, 0.7],
      dir: [0xff88aa, 0.8],
      point: [0xff2d78, 1.5],
      accent: [0xff69b4, 1.2],
      spot: [0xffd0e0, 1.3]
    },
    sunset: {
      label: "Sunset",
      bg: 0x0f0804,
      fog: 0x0f0804,
      fogDensity: 0.02,
      gridA: 0xffd700,
      gridB: 0x1a1208,
      gridC: 0x332a10,
      gridD: 0x1a1004,
      ambient: [0x2a2010, 1.0],
      dir: [0xfff4cc, 1.1],
      point: [0xffd700, 1.2],
      accent: [0xff8c00, 0.9],
      spot: [0xffeecc, 1.6]
    }
  };

  const shapeNames = {
    cube: "Cube",
    sphere: "Sphere",
    torus: "Torus",
    cone: "Cone",
    octahedron: "Octahedron"
  };

  function getShapeBaseColor(type) {
    const s = scenes[currentSceneId];
    // derive per-shape color from scene accent
    const base = s.point[0];
    const offsets = {
      cube: 0,
      sphere: 0x002200,
      torus: 0x000022,
      cone: 0x101010,
      octahedron: 0x001100
    };
    return (base + (offsets[type] || 0)) & 0xffffff;
  }

  function createGeometry(type) {
    switch (type) {
      case "cube":
        return new THREE.BoxGeometry(1.4, 1.4, 1.4);
      case "sphere":
        return new THREE.SphereGeometry(0.9, 48, 48);
      case "torus":
        return new THREE.TorusGeometry(0.8, 0.3, 20, 80);
      case "cone":
        return new THREE.ConeGeometry(0.8, 1.6, 48);
      case "octahedron":
        return new THREE.OctahedronGeometry(1.0);
      default:
        return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    }
  }

  /* ---------- Material factory ---------- */
  function makeMaterial(matId, color) {
    switch (matId) {
      case "wireframe":
        return new THREE.MeshStandardMaterial({
          color,
          wireframe: true,
          emissive: color,
          emissiveIntensity: 0.3
        });
      case "glass":
        return new THREE.MeshPhysicalMaterial()
          ? new THREE.MeshStandardMaterial({
              color,
              metalness: 0.0,
              roughness: 0.05,
              transparent: true,
              opacity: 0.4,
              emissive: color,
              emissiveIntensity: 0.1
            })
          : new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: 0.4
            });
      case "chrome":
        return new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 1.0,
          roughness: 0.05,
          emissive: color,
          emissiveIntensity: 0.08
        });
      case "emissive":
        return new THREE.MeshStandardMaterial({
          color,
          metalness: 0.2,
          roughness: 0.4,
          emissive: color,
          emissiveIntensity: 1.0
        });
      default:
        // standard
        return new THREE.MeshStandardMaterial({
          color,
          metalness: 0.45,
          roughness: 0.3,
          emissive: color,
          emissiveIntensity: 0.15
        });
    }
  }

  /* ---------- Apply material to all shapes ---------- */
  function applyMaterial(matId) {
    currentMat = matId;
    pgShapes.forEach((m) => {
      const color = getShapeBaseColor(m.userData.shapeType);
      const newMat = makeMaterial(matId, color);
      newMat.emissiveIntensity = m === selectedShape ? 0.6 : 0.15;
      m.userData.baseEmissiveIntensity = matId === "emissive" ? 0.8 : 0.15;
      m.material.dispose();
      m.material = newMat;
    });
    // highlight active btn
    document
      .querySelectorAll("[data-mat]")
      .forEach((b) => b.classList.toggle("active", b.dataset.mat === matId));
  }

  /* ---------- Apply scene ---------- */
  function applyScene(id) {
    currentSceneId = id;
    const s = scenes[id];
    pgScene.background.set(s.bg);
    pgScene.fog.color.set(s.fog);
    pgScene.fog.density = s.fogDensity;
    pgRenderer.setClearColor(s.bg);

    // Update lights
    pgLights.ambient.color.set(s.ambient[0]);
    pgLights.ambient.intensity = s.ambient[1];
    pgLights.dir.color.set(s.dir[0]);
    pgLights.dir.intensity = s.dir[1];
    pgLights.point.color.set(s.point[0]);
    pgLights.point.intensity = s.point[1];
    pgLights.accent.color.set(s.accent[0]);
    pgLights.accent.intensity = s.accent[1];
    pgLights.spot.color.set(s.spot[0]);
    pgLights.spot.intensity = s.spot[1];

    // Update grids
    pgGridMain.material.color.set(s.gridA);
    pgGridSub.material.color.set(s.gridC);

    // Update shape materials
    applyMaterial(currentMat);

    // Label
    if (sceneLabel) sceneLabel.textContent = s.label + " Scene";
    document
      .querySelectorAll("[data-scene]")
      .forEach((b) => b.classList.toggle("active", b.dataset.scene === id));
  }

  /* ---------- Camera presets ---------- */
  function flyCamera(pos, target, duration) {
    duration = duration || 600;
    const startPos = pgCamera.position.clone();
    const startTarget = pgControls.target.clone();
    const endPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const endTarget = new THREE.Vector3(target[0], target[1], target[2]);
    const startTime = performance.now();
    function step() {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      pgCamera.position.lerpVectors(startPos, endPos, ease);
      pgControls.target.lerpVectors(startTarget, endTarget, ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const camPresets = {
    front: { pos: [0, 2, 16], target: [0, 0, 0] },
    top: { pos: [0, 20, 0.1], target: [0, 0, 0] },
    side: { pos: [18, 3, 0], target: [0, 0, 0] },
    close: { pos: [0, 2, 6], target: [0, 0, 0] },
    far: { pos: [0, 8, 30], target: [0, 0, 0] }
  };

  /* ---------- Init ---------- */
  function initScene() {
    if (initialized) return;
    initialized = true;

    const w = window.innerWidth,
      h = window.innerHeight;
    pgRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    pgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    pgRenderer.setSize(w, h);
    pgRenderer.setClearColor(0x0a0806);
    registerRenderer(pgRenderer);

    pgScene = new THREE.Scene();
    pgScene.background = new THREE.Color(0x0a0806);
    pgScene.fog = new THREE.FogExp2(0x0a0806, 0.03);

    pgCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    pgCamera.position.set(0, 5, 16);

    pgControls = new THREE.OrbitControls(pgCamera, canvas);
    pgControls.enableDamping = true;
    pgControls.dampingFactor = 0.08;
    pgControls.minDistance = 2;
    pgControls.maxDistance = 40;
    pgControls.maxPolarAngle = Math.PI * 0.88;
    pgControls.target.set(0, 0, 0);
    pgControls.update();

    // Lights (keyed for toggling)
    const s = scenes.ember;
    pgLights.ambient = new THREE.AmbientLight(s.ambient[0], s.ambient[1]);
    pgScene.add(pgLights.ambient);
    pgLights.dir = new THREE.DirectionalLight(s.dir[0], s.dir[1]);
    pgLights.dir.position.set(5, 12, 5);
    pgScene.add(pgLights.dir);
    pgLights.point = new THREE.PointLight(s.point[0], s.point[1], 40);
    pgLights.point.position.set(-8, 5, 4);
    pgScene.add(pgLights.point);
    pgLights.accent = new THREE.PointLight(s.accent[0], s.accent[1], 35);
    pgLights.accent.position.set(8, 3, -4);
    pgScene.add(pgLights.accent);
    pgLights.spot = new THREE.SpotLight(
      s.spot[0],
      s.spot[1],
      50,
      Math.PI / 5,
      0.5
    );
    pgLights.spot.position.set(0, 15, 5);
    pgLights.spot.target.position.set(0, 0, 0);
    pgScene.add(pgLights.spot);
    pgScene.add(pgLights.spot.target);

    // Neon ground grid
    pgGridMain = new THREE.GridHelper(40, 40, s.gridA, s.gridB);
    pgGridMain.position.y = -2;
    pgGridMain.material.opacity = 0.5;
    pgGridMain.material.transparent = true;
    pgScene.add(pgGridMain);
    pgGridSub = new THREE.GridHelper(40, 80, s.gridC, s.gridD);
    pgGridSub.position.y = -2.01;
    pgGridSub.material.opacity = 0.3;
    pgGridSub.material.transparent = true;
    pgScene.add(pgGridSub);

    // Place 5 shapes
    const types = ["cube", "sphere", "torus", "cone", "octahedron"];
    const spacing = 3.5;
    const startX = -((types.length - 1) * spacing) / 2;

    types.forEach((type, i) => {
      const geo = createGeometry(type);
      const color = getShapeBaseColor(type);
      const mat = makeMaterial("standard", color);
      const mesh = new THREE.Mesh(geo, mat);
      const x = startX + i * spacing;
      mesh.position.set(x, 0.5, 0);
      mesh.userData.shapeType = type;
      mesh.userData.origPos = [x, 0.5, 0];
      mesh.userData.baseEmissiveIntensity = 0.15;
      pgScene.add(mesh);
      pgShapes.push(mesh);
    });

    pgRaycaster = new THREE.Raycaster();
    pgMouse = new THREE.Vector2();
    pgDragPlane = new THREE.Plane();
    pgDragOffset = new THREE.Vector3();

    canvas.addEventListener("pointerdown", onPgPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPgPointerMove, { passive: false });
    canvas.addEventListener("pointerup", onPgPointerUp);
    canvas.addEventListener("pointerleave", onPgPointerLeave);
    window.addEventListener("resize", onPgResize);
  }

  function onPgResize() {
    if (!initialized) return;
    const w = window.innerWidth,
      h = window.innerHeight;
    pgCamera.aspect = w / h;
    pgCamera.updateProjectionMatrix();
    pgRenderer.setSize(w, h);
  }

  /* ---------- Pointer events ---------- */
  function onPgPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    pgPointerStart = { x: e.clientX, y: e.clientY };
    pgMouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    pgRaycaster.setFromCamera(pgMouse, pgCamera);
    const hits = pgRaycaster.intersectObjects(pgShapes);
    if (hits.length && e.button === 0) {
      pgDragging = true;
      pgDragMesh = hits[0].object;
      pgControls.enabled = false;
      pgDragPlane.setFromNormalAndCoplanarPoint(
        pgCamera.getWorldDirection(new THREE.Vector3()).negate(),
        hits[0].point
      );
      const pt = new THREE.Vector3();
      pgRaycaster.ray.intersectPlane(pgDragPlane, pt);
      pgDragOffset.copy(pt).sub(pgDragMesh.position);
      canvas.classList.add("dragging");
      selectShape(pgDragMesh);
    }
  }

  function onPgPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    pgMouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    if (pgDragging && pgDragMesh) {
      pgRaycaster.setFromCamera(pgMouse, pgCamera);
      const pt = new THREE.Vector3();
      pgRaycaster.ray.intersectPlane(pgDragPlane, pt);
      pgDragMesh.position.copy(pt.sub(pgDragOffset));
      return;
    }

    pgRaycaster.setFromCamera(pgMouse, pgCamera);
    const hits = pgRaycaster.intersectObjects(pgShapes);
    const hitSet = new Set(hits.map((h) => h.object));
    pgShapes.forEach((m) => {
      if (hitSet.has(m) && !pgHovered.has(m)) {
        pgHovered.add(m);
        m.material.emissiveIntensity = 0.5;
        playHover();
      } else if (!hitSet.has(m) && pgHovered.has(m)) {
        pgHovered.delete(m);
        m.material.emissiveIntensity =
          m === selectedShape ? 0.6 : m.userData.baseEmissiveIntensity;
      }
    });
  }

  function onPgPointerUp(e) {
    if (pgDragging && pgDragMesh) {
      const dx = Math.abs(e.clientX - pgPointerStart.x);
      const dy = Math.abs(e.clientY - pgPointerStart.y);
      if (dx < 8 && dy < 8) {
        if (pgSpinning.has(pgDragMesh)) {
          pgSpinning.delete(pgDragMesh);
          sfxSpin();
        } else {
          pgSpinning.add(pgDragMesh);
          sfxSpin();
        }
      }
      updateInfo(pgDragMesh.userData.shapeType, pgSpinning.has(pgDragMesh));
      pgDragMesh = null;
    }
    pgDragging = false;
    pgControls.enabled = true;
    canvas.classList.remove("dragging");
  }

  function onPgPointerLeave() {
    pgDragging = false;
    pgDragMesh = null;
    pgControls.enabled = true;
    canvas.classList.remove("dragging");
    pgHovered.forEach((m) => {
      m.material.emissiveIntensity =
        m === selectedShape ? 0.6 : m.userData.baseEmissiveIntensity;
    });
    pgHovered.clear();
  }

  /* ---------- Selection ---------- */
  function selectShape(mesh) {
    if (selectedShape && selectedShape !== mesh) {
      selectedShape.material.emissiveIntensity =
        selectedShape.userData.baseEmissiveIntensity;
    }
    selectedShape = mesh;
    mesh.material.emissiveIntensity = 0.6;
    highlightShapeBtn(mesh.userData.shapeType);
    updateInfo(mesh.userData.shapeType, pgSpinning.has(mesh));
    sfxSelect();
    // Reveal left panel
    if (hudLeft) hudLeft.classList.add("visible");
    // Slight zoom toward shape
    zoomToShape(mesh);
  }

  function zoomToShape(mesh) {
    const target = new THREE.Vector3(
      mesh.position.x,
      mesh.position.y,
      mesh.position.z
    );
    const startTarget = pgControls.target.clone();
    const startPos = pgCamera.position.clone();
    // Move camera slightly closer
    const dir = new THREE.Vector3().subVectors(startPos, target).normalize();
    const dist = startPos.distanceTo(target);
    const newDist = Math.max(5, dist * 0.75);
    const endPos = target.clone().add(dir.multiplyScalar(newDist));
    endPos.y = Math.max(endPos.y, 1.5);
    const startTime = performance.now();
    const duration = 450;
    sfxZoomIn();
    function step() {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      pgControls.target.lerpVectors(
        startTarget,
        new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z),
        ease
      );
      pgCamera.position.lerpVectors(startPos, endPos, ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function flyToShape(mesh) {
    selectShape(mesh);
  }

  function updateInfo(type, spinning) {
    if (infoEl) {
      infoEl.textContent =
        shapeNames[type] +
        (spinning ? " — spinning" : " — selected (click to spin)");
    }
  }

  function highlightShapeBtn(type) {
    document.querySelectorAll(".pg-shape-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.shape === type);
    });
  }

  /* ---------- Button wiring ---------- */

  // Shape buttons
  document.querySelectorAll(".pg-shape-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.shape;
      const mesh = pgShapes.find((m) => m.userData.shapeType === type);
      if (!mesh || !initialized) return;
      flyToShape(mesh);
    });
  });

  // Material buttons
  document.querySelectorAll("[data-mat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyMaterial(btn.dataset.mat);
      sfxMaterial();
    });
  });

  // Camera buttons
  document.querySelectorAll("[data-cam]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = camPresets[btn.dataset.cam];
      if (!p || !initialized) return;
      flyCamera(p.pos, p.target);
      sfxCamera();
      document
        .querySelectorAll("[data-cam]")
        .forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // Scene buttons
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!initialized) return;
      applyScene(btn.dataset.scene);
      sfxScene();
    });
  });

  // Light buttons
  document.querySelectorAll("[data-light]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!initialized) return;
      const action = btn.dataset.light;

      if (action === "ambient" || action === "dir" || action === "spot") {
        const light =
          action === "ambient"
            ? pgLights.ambient
            : action === "dir"
            ? pgLights.dir
            : pgLights.spot;
        light.visible = !light.visible;
        btn.classList.toggle("active", light.visible);
        sfxLight();
        return;
      }
      if (action === "point") {
        pgLights.point.visible = !pgLights.point.visible;
        pgLights.accent.visible = pgLights.point.visible;
        btn.classList.toggle("active", pgLights.point.visible);
        sfxLight();
        return;
      }
      if (action === "add-point") {
        const color = [
          0xff4d00,
          0xff8c00,
          0xffd700,
          0x00e5c8,
          0xff2d78,
          0x7b2fff
        ][Math.floor(Math.random() * 6)];
        const pl = new THREE.PointLight(color, 1.5, 30);
        pl.position.set(
          (Math.random() - 0.5) * 16,
          2 + Math.random() * 6,
          (Math.random() - 0.5) * 10
        );
        pgScene.add(pl);
        extraLights.push(pl);
        sfxLight();
        return;
      }
      if (action === "add-spot") {
        const color = [0xffffff, 0xff4d00, 0xffd700, 0x00e5c8, 0xff2d78][
          Math.floor(Math.random() * 5)
        ];
        const sl = new THREE.SpotLight(color, 2, 40, Math.PI / 6, 0.5);
        sl.position.set(
          (Math.random() - 0.5) * 12,
          8 + Math.random() * 6,
          (Math.random() - 0.5) * 8
        );
        sl.target.position.set(0, 0, 0);
        pgScene.add(sl);
        pgScene.add(sl.target);
        extraLights.push(sl);
        sfxLight();
        return;
      }
      if (action === "reset") {
        extraLights.forEach((l) => {
          pgScene.remove(l);
          if (l.target) pgScene.remove(l.target);
        });
        extraLights = [];
        // Re-enable all core lights
        Object.values(pgLights).forEach((l) => {
          l.visible = true;
        });
        document
          .querySelectorAll(".pg-toggle-btn[data-light]")
          .forEach((b) => b.classList.add("active"));
        sfxScene();
        return;
      }
    });
  });

  /* ---------- Animation ---------- */
  function animatePlayground() {
    pgAnimId = requestAnimationFrame(animatePlayground);
    if (!overlay.classList.contains("open")) return;
    pgT += 0.01;
    pgShapes.forEach((m, i) => {
      const spd = pgSpinning.has(m) ? 0.04 : 0.005;
      m.rotation.y += spd;
      m.rotation.x += spd * 0.3;
      if (!pgDragging || pgDragMesh !== m) {
        m.position.y = m.userData.origPos[1] + Math.sin(pgT + i * 1.2) * 0.2;
      }
      const isSelected = m === selectedShape;
      const ts = pgHovered.has(m) ? 1.2 : isSelected ? 1.1 : 1;
      m.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.1);
    });
    pgControls.update();
    pgRenderer.render(pgScene, pgCamera);
  }

  /* ---------- Open / Close ---------- */
  openBtn.addEventListener("click", () => {
    overlay.classList.add("open");
    requestAnimationFrame(() => {
      initScene();
      onPgResize();
      if (!pgAnimId) animatePlayground();
    });
    playReveal();
  });
  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("open");
    if (hudLeft) hudLeft.classList.remove("visible");
    playClick();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      overlay.classList.remove("open");
      if (hudLeft) hudLeft.classList.remove("visible");
      playClick();
    }
  });
})();
