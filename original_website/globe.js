import createGlobe from 'https://esm.sh/cobe@0.6.3';

const canvas = document.getElementById('globe-canvas');

const markers = [
  { id: "sf", location: [37.7595, -122.4367], size: 0.035 },
  { id: "nyc", location: [40.7128, -74.006], size: 0.035 },
  { id: "tokyo", location: [35.6762, 139.6503], size: 0.035 },
  { id: "london", location: [51.5074, -0.1278], size: 0.035 },
  { id: "sydney", location: [-33.8688, 151.2093], size: 0.035 },
  { id: "capetown", location: [-33.9249, 18.4241], size: 0.035 },
  { id: "dubai", location: [25.2048, 55.2708], size: 0.035 },
  { id: "paris", location: [48.8566, 2.3522], size: 0.035 },
  { id: "saopaulo", location: [-23.5505, -46.6333], size: 0.035 },
];

const arcs = [
  { from: [37.7595, -122.4367], to: [35.6762, 139.6503] },
  { from: [40.7128, -74.006], to: [51.5074, -0.1278] },
];

let phi = 0;
let theta = 0.2;
let width = 0;
let pointerInteracting = null;
let lastPointer = null;
let dragOffset = { phi: 0, theta: 0 };
let velocity = { phi: 0, theta: 0 };
let phiOffsetRef = 0;
let thetaOffsetRef = 0;
let isPaused = false;
let globe = null;
let animationId = null;

function initGlobe() {
  if (!canvas) return;
  // Get container width or window width if absolute
  width = canvas.parentElement.offsetWidth;
  if (width === 0) return;
  
  // Set canvas fixed size based on container to maintain aspect ratio 1:1 
  // actually, if we want it as a background, maybe it should fill the header?
  // cobe requires height = width for a perfect circle.
  // We'll set canvas width/height to the hero section's width
  canvas.width = width;
  canvas.height = width;
  
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  if (globe) {
    globe.destroy();
  }

  globe = createGlobe(canvas, {
    devicePixelRatio: dpr,
    width: width,
    height: width,
    phi: 0,
    theta: 0.2,
    dark: 1, // original site is dark theme
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [0.3, 0.3, 0.3],
    markerColor: [0, 0.95, 1], // neon blue for cyber theme
    glowColor: [0, 0.5, 1], // dark blue glow
    markerElevation: 0.01,
    markers: markers,
    arcs: arcs,
    arcColor: [0, 0.95, 1],
    arcWidth: 0.5,
    arcHeight: 0.25,
    opacity: 0.8,
    onRender: (state) => {
      if (!isPaused) {
        phi += 0.003;
        if (Math.abs(velocity.phi) > 0.0001 || Math.abs(velocity.theta) > 0.0001) {
          phiOffsetRef += velocity.phi;
          thetaOffsetRef += velocity.theta;
          velocity.phi *= 0.95;
          velocity.theta *= 0.95;
        }
        const thetaMin = -0.4, thetaMax = 0.4;
        if (thetaOffsetRef < thetaMin) {
          thetaOffsetRef += (thetaMin - thetaOffsetRef) * 0.1;
        } else if (thetaOffsetRef > thetaMax) {
          thetaOffsetRef += (thetaMax - thetaOffsetRef) * 0.1;
        }
      }
      
      state.phi = phi + phiOffsetRef + dragOffset.phi;
      state.theta = theta + thetaOffsetRef + dragOffset.theta;
    }
  });
  
  setTimeout(() => canvas.style.opacity = "1", 100);
}

const ro = new ResizeObserver(() => {
  initGlobe();
});
ro.observe(canvas.parentElement);

canvas.addEventListener("pointerdown", (e) => {
  pointerInteracting = { x: e.clientX, y: e.clientY };
  canvas.style.cursor = "grabbing";
  isPaused = true;
});

window.addEventListener("pointermove", (e) => {
  if (pointerInteracting !== null) {
    const deltaX = e.clientX - pointerInteracting.x;
    const deltaY = e.clientY - pointerInteracting.y;
    dragOffset = { phi: deltaX / 300, theta: deltaY / 1000 };
    const now = Date.now();
    if (lastPointer) {
      const dt = Math.max(now - lastPointer.t, 1);
      const maxVelocity = 0.15;
      velocity = {
        phi: Math.max(-maxVelocity, Math.min(maxVelocity, ((e.clientX - lastPointer.x) / dt) * 0.3)),
        theta: Math.max(-maxVelocity, Math.min(maxVelocity, ((e.clientY - lastPointer.y) / dt) * 0.08)),
      };
    }
    lastPointer = { x: e.clientX, y: e.clientY, t: now };
  }
}, { passive: true });

window.addEventListener("pointerup", () => {
  if (pointerInteracting !== null) {
    phiOffsetRef += dragOffset.phi;
    thetaOffsetRef += dragOffset.theta;
    dragOffset = { phi: 0, theta: 0 };
    lastPointer = null;
  }
  pointerInteracting = null;
  canvas.style.cursor = "grab";
  isPaused = false;
}, { passive: true });

initGlobe();
