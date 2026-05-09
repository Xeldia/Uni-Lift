import { useEffect, useRef } from "react";

/**
 * ParticleWave
 *
 * A full-area Three.js particle system that renders a rolling 3D sine-wave
 * landscape. Designed to sit behind the login page content.
 *
 * ─── CUSTOMIZATION GUIDE ──────────────────────────────────────────────────────
 *
 * DOT COLOR
 *   Change the `color` prop passed into <ParticleWave> from the parent, or
 *   edit the default: `color="#ffffff"` on line ~30 of this file.
 *   Any CSS hex color works, e.g. "#a0c4ff" for a cool blue tint.
 *
 * WAVE SPEED
 *   Edit `WAVE_SPEED` constant below. Higher = faster roll. (default: 0.35)
 *
 * WAVE HEIGHT (amplitude)
 *   Edit `WAVE_AMPLITUDE` constant below. Higher = taller peaks. (default: 2.2)
 *
 * WAVE FREQUENCY (how many peaks across the grid)
 *   Edit `WAVE_FREQ_X` and `WAVE_FREQ_Z` below.
 *
 * CAMERA MOUSE SENSITIVITY
 *   Edit `MOUSE_SENSITIVITY_X` and `MOUSE_SENSITIVITY_Y` below.
 *
 * FOG / DEPTH FADE
 *   Edit `FOG_NEAR` and `FOG_FAR` below.
 *   FOG_NEAR = distance at which dots start fading (closer = fades sooner)
 *   FOG_FAR  = distance at which dots are fully invisible
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Tunable Constants ─────────────────────────────────────────────────────────
const GRID_WIDTH      = 120;   // number of columns in the dot grid
const GRID_HEIGHT     = 80;    // number of rows in the dot grid
const GRID_SPACING    = 0.55;  // world-unit gap between dots
const WAVE_SPEED      = 0.35;  // animation speed multiplier
const WAVE_AMPLITUDE  = 1.6;   // peak height of the wave
const WAVE_FREQ_X     = 0.55;  // wave frequency along X axis
const WAVE_FREQ_Z     = 0.38;  // wave frequency along Z axis
const DOT_SIZE        = 1.2;   // rendered dot size in pixels (PointsMaterial)
const FOG_NEAR        = 8;     // fog starts this many units from camera
const FOG_FAR         = 26;    // fog is complete at this distance
const MOUSE_SENSITIVITY_X = 2.2;  // how far camera shifts on X with mouse
const MOUSE_SENSITIVITY_Y = 1.2;  // how far camera shifts on Y with mouse
const LERP_FACTOR     = 0.04;  // camera smooth-follow speed (0 = frozen, 1 = instant)

export function ParticleWave({ color = "#ffffff", className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Lazy-load Three.js from window (injected via CDN script tag) ──────────
    // We import via the global THREE injected by the <script> tag in index.html.
    // This keeps this component zero-bundle-impact — Three.js is never bundled.
    let THREE = window.THREE;
    if (!THREE) {
      console.warn("ParticleWave: window.THREE not found. Did you add the Three.js CDN script?");
      return;
    }

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Fog: matches pure black (#000000) — dots dissolve into the void
    // To change background color: edit both THREE.Color and scene.background below
    // ✏️ BACKGROUND COLOR: change "#000000" to any hex color
    scene.fog = new THREE.FogExp2(0x000000, 0.062); // exponential fog — higher = stronger fade
    scene.background = new THREE.Color(0x000000);

    // ── Camera ────────────────────────────────────────────────────────────────
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);

    // Oblique downward angle: camera sits above and behind, looking down-forward
    camera.position.set(0, 16, 28);
    camera.lookAt(0, -2, 0);

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ── Geometry: flat grid of vertices ───────────────────────────────────────
    const totalPoints = GRID_WIDTH * GRID_HEIGHT;
    const positions = new Float32Array(totalPoints * 3);

    const offsetX = ((GRID_WIDTH - 1) * GRID_SPACING) / 2;
    const offsetZ = ((GRID_HEIGHT - 1) * GRID_SPACING) / 2;

    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const i = (row * GRID_WIDTH + col) * 3;
        positions[i]     = col * GRID_SPACING - offsetX; // X
        positions[i + 1] = 0;                            // Y (wave applied each frame)
        positions[i + 2] = row * GRID_SPACING - offsetZ; // Z
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // ── Circle Texture Helper ─────────────────────────────────────────────────
    // Creates an in-memory <canvas> with a radial gradient (white core →
    // transparent edge) and converts it to a THREE.CanvasTexture.
    // No external image files needed — fully self-contained.
    const createGlowCircleTexture = (size = 96) => {
      const canvas   = document.createElement("canvas");
      canvas.width   = size;
      canvas.height  = size;
      const ctx      = canvas.getContext("2d");
      const center   = size / 2;
      const radius   = size / 2;

      // Radial gradient: bright white core ──► fully transparent rim
      // Tweak the color-stop values to make the glow tighter or wider.
      const gradient = ctx.createRadialGradient(
        center, center, 0,      // inner circle  (pinpoint centre)
        center, center, radius  // outer circle  (canvas edge)
      );
      gradient.addColorStop(0.00, "rgba(255, 255, 255, 1.00)"); // pure white core
      gradient.addColorStop(0.30, "rgba(255, 255, 255, 0.75)"); // bright mid-glow
      gradient.addColorStop(0.60, "rgba(255, 255, 255, 0.20)"); // soft outer halo
      gradient.addColorStop(1.00, "rgba(255, 255, 255, 0.00)"); // fully transparent

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    const circleTexture = createGlowCircleTexture(96);

    // ── Material ──────────────────────────────────────────────────────────────
    // ✏️ DOT COLOR: change the `color` prop on <ParticleWave color="#ffffff" />
    //    in LoginPage.jsx, OR change the default in the function signature above.
    //
    // WHY alphaTest?
    //   WebGL sorts draw calls by object, not by individual particle. Without
    //   alphaTest, the fully-transparent corners of each particle's quad are
    //   written to the depth buffer, causing particles behind them to be
    //   incorrectly hidden (depth-fighting artefact). alphaTest: 0.01 discards
    //   any fragment whose alpha is essentially zero before it ever touches the
    //   depth buffer — eliminating the occlusion bug.
    //
    // WHY depthWrite: false?
    //   For a soft radial gradient the alpha transition is continuous, so even
    //   with alphaTest some semi-transparent pixels remain. Disabling depth
    //   writes means those pixels never block anything behind them, giving
    //   perfectly layered, overlapping glows.
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: DOT_SIZE,
      map: circleTexture,        // swap default square for our glow circle
      sizeAttenuation: true,     // dots shrink with distance (perspective)
      fog: true,                 // dots obey scene fog → depth fade effect
      transparent: true,
      alphaTest: 0.01,           // discard near-zero alpha fragments (see above)
      depthWrite: false,         // no depth writes → no occlusion from soft edges
      opacity: 0.80,             // slightly higher than before; glow is subtler
    });

    const points = new THREE.Points(geometry, material);
    // Tilt the entire grid slightly for better oblique viewing angle
    points.rotation.x = -0.18;
    scene.add(points);

    // ── Mouse tracking ────────────────────────────────────────────────────────
    let targetCamX = 0;
    let targetCamY = 0;
    const baseCamY = camera.position.y;

    const handleMouseMove = (e) => {
      // Normalize mouse to [-1, +1]
      const nx = (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetCamX =  nx * MOUSE_SENSITIVITY_X;
      targetCamY = -ny * MOUSE_SENSITIVITY_Y;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ── Resize handler ────────────────────────────────────────────────────────
    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    // ── Animation loop ────────────────────────────────────────────────────────
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime() * WAVE_SPEED;

      // Update every vertex Y with a multi-layered sine wave
      // ✏️ WAVE MATH: tweak WAVE_AMPLITUDE, WAVE_FREQ_X, WAVE_FREQ_Z above
      const pos = geometry.attributes.position;
      for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
          const i = row * GRID_WIDTH + col;
          const x = pos.getX(i);
          const z = pos.getZ(i);

          // Primary rolling wave + secondary cross-wave for organic feel
          const y =
            Math.sin(x * WAVE_FREQ_X + t) * WAVE_AMPLITUDE +
            Math.sin(z * WAVE_FREQ_Z + t * 0.7) * (WAVE_AMPLITUDE * 0.45) +
            Math.cos((x + z) * 0.25 + t * 0.5) * (WAVE_AMPLITUDE * 0.25);

          pos.setY(i, y);
        }
      }
      pos.needsUpdate = true;

      // Smooth camera follow via lerp
      // ✏️ LERP FACTOR: increase LERP_FACTOR for snappier tracking, lower for floatier
      camera.position.x += (targetCamX - camera.position.x) * LERP_FACTOR;
      camera.position.y += (baseCamY + targetCamY - camera.position.y) * LERP_FACTOR;
      camera.lookAt(0, -1, 0);

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      circleTexture.dispose();   // free GPU memory for the canvas texture
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [color]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
