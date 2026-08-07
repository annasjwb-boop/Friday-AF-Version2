import { useEffect, useRef } from "react";

/**
 * A real mesh-gradient shader on a plain canvas, reusable anywhere a
 * surface needs the organic field (full-screen backdrop, header bands).
 * Eight colors are anchored at fixed, art-directed positions (bright
 * bloom top-left, hues through the middle, dark masses low), then the
 * whole field is domain-warped with fbm noise so the color boundaries
 * bleed unevenly — fluid, not circular. Colors blend as a weighted
 * average in OKLab so overlaps stay chroma-rich instead of going muddy,
 * a bottom wash sinks the lower third toward the deep tone, and film
 * grain is applied in-shader. Drifts very slowly; holds a static frame
 * under prefers-reduced-motion.
 */

const VERTEX_SRC = `attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_lab[8]; // theme colors, pre-converted to OKLab on the CPU
uniform vec3 u_deep;   // bottom-wash tone, OKLab
uniform float u_band;  // 0 = full-screen backdrop, 1 = short header band

const float SEED = 7.0;

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Even, un-structured white noise for film grain (Dave Hoskins hash12).
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

vec3 linearToSrgb(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res; // y = 0 at the bottom
  float aspect = u_res.x / u_res.y;
  // Isotropic space: y spans 0..1, x scaled by aspect so distances (and
  // therefore blob shapes) aren't stretched by the portrait viewport.
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Domain warp: one large fluid warp that slowly drifts, plus a smaller
  // high-frequency wobble so edges vary between tight and fully melted.
  float t = u_time * 0.02;
  vec2 w1 = vec2(
    fbm(p * 1.7 + vec2(t, -t * 0.7) + SEED),
    fbm(p * 1.7 + vec2(4.7, 9.3) - vec2(t * 0.8, t)));
  vec2 w2 = vec2(
    fbm(p * 5.2 - t + 2.0),
    fbm(p * 5.2 + t + 7.4));
  vec2 q = p + (w1 - 0.5) * 0.56 + (w2 - 0.5) * 0.14;

  // Anchor points (x in design 0..1, later aspect-scaled; y up):
  // position.xy, radius, gain. Scattered latitudes, varied radii, and two
  // anchors pushed off-frame so their color bleeds in from an edge the
  // way real mesh tools do. Dark masses carry extra gain so the low
  // register comes from heavy pockets of dark, not a fade.
  vec4 pts[8];
  pts[0] = vec4(0.16, 0.88, 0.42, 1.0);  // bright bloom
  pts[1] = vec4(0.85, 0.96, 0.34, 0.9);  // hue A
  pts[2] = vec4(0.50, 0.66, 0.26, 1.05); // hue B — tight ribbon
  pts[3] = vec4(1.04, 0.50, 0.34, 1.0);  // hue C — bleeds in from the right
  pts[4] = vec4(-0.06, 0.44, 0.32, 0.9); // counter — bleeds in from the left
  pts[5] = vec4(0.62, 0.28, 0.38, 1.1);  // hue D
  pts[6] = vec4(0.16, 0.12, 0.42, 1.5);  // dark mass
  pts[7] = vec4(0.88, 0.02, 0.46, 1.5);  // dark mass

  // Band layout: a short, wide field stays luminous — big bloom upper
  // left, hues flowing across, and the dark masses pushed below the
  // frame so they only breathe in from the bottom edge (which the sheet
  // covers anyway).
  if (u_band > 0.5) {
    pts[0] = vec4(-0.02, 1.04, 0.5, 1.25); // bloom bleeds in from the corner

    pts[1] = vec4(0.88, 0.92, 0.42, 1.0);
    pts[2] = vec4(0.48, 0.52, 0.32, 1.0);
    pts[3] = vec4(1.08, 0.34, 0.38, 1.0);
    pts[4] = vec4(-0.08, 0.26, 0.36, 0.9);
    pts[5] = vec4(0.64, 0.06, 0.42, 1.0);
    pts[6] = vec4(0.24, -0.16, 0.46, 1.1);
    pts[7] = vec4(0.92, -0.2, 0.48, 1.1);
  }

  // Weighted OKLab average. Gaussian falloff in warped space, modulated
  // by per-field noise, then sharpened (softmax-style) so each color owns
  // territory and meets its neighbors in narrower, cell-like blends
  // instead of averaging into a ramp.
  vec3 acc = u_deep * 0.015;
  float total = 0.015;
  for (int i = 0; i < 8; i++) {
    vec2 c = vec2(pts[i].x * aspect, pts[i].y);
    float r = pts[i].z;
    vec2 d = q - c;
    float w = exp(-dot(d, d) / (r * r));
    w *= 0.55 + 0.9 * noise(q * 2.6 + float(i) * 13.7 + SEED);
    w = pow(w, 1.6) * pts[i].w;
    acc += u_lab[i] * w;
    total += w;
  }
  vec3 lab = acc / total;

  // A quiet assist for panel legibility — evaluated mostly in warped
  // space so its edge waves and pools instead of drawing a horizon line.
  // The band barely needs it: its lower edge hides under the sheet.
  float wash = smoothstep(0.5, 0.02, mix(uv.y, q.y, 0.7));
  lab = mix(lab, u_deep, wash * mix(0.45, 0.14, u_band));

  // Bands run richer: a touch more chroma so the short field reads as a
  // vivid material rather than a muddy strip.
  lab.yz *= mix(1.0, 1.1, u_band);

  vec3 col = linearToSrgb(oklabToLin(lab));
  col = (col - 0.5) * mix(1.05, 1.1, u_band) + 0.5; // gentle global contrast
  col += (grainHash(gl_FragCoord.xy + SEED) - 0.5) * 0.075;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/** sRGB hex -> OKLab, done once on the CPU per theme color. */
function hexToOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const chan = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = chan;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function MeshGradientCanvas({
  mesh,
  deep,
  band = false,
  className,
}: {
  /** Eight colors in the shader's anchor order. */
  mesh: readonly string[];
  /** Deep tone the bottom of the field washes toward. */
  deep: string;
  /** Header-band tuning: wide-short anchor layout, vivid, minimal wash. */
  band?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The GL program is built once; palette changes only re-upload the
  // color uniforms via this ref.
  const applyThemeRef = useRef<
    ((mesh: readonly string[], deep: string) => void) | null
  >(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return; // No WebGL: the flat fill behind remains as fallback.

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Fullscreen triangle.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uLab = gl.getUniformLocation(program, "u_lab");
    const uDeep = gl.getUniformLocation(program, "u_deep");
    gl.uniform1f(gl.getUniformLocation(program, "u_band"), band ? 1 : 0);

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let vw = 0;
    let vh = 0;
    let raf = 0;
    let elapsed = 0;
    let last = performance.now();

    const draw = (seconds: number) => {
      gl.uniform2f(uRes, vw, vh);
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const drawStatic = () => draw(reducedMotion ? 8.0 : elapsed / 1000);

    applyThemeRef.current = (colors, deepHex) => {
      const labData = new Float32Array(24);
      colors.forEach((hex, i) => labData.set(hexToOklab(hex), i * 3));
      gl.uniform3fv(uLab, labData);
      const [dl, da, db] = hexToOklab(deepHex);
      gl.uniform3f(uDeep, dl, da, db);
      // Under reduced motion there is no frame loop, so repaint now.
      if (reducedMotion || document.hidden) drawStatic();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w === vw && h === vh) return;
      vw = w;
      vh = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      if (reducedMotion) drawStatic();
    };
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(resize);
    });
    observer.observe(canvas);
    resize();

    const frameLoop = (now: number) => {
      elapsed += now - last;
      last = now;
      draw(elapsed / 1000);
      raf = requestAnimationFrame(frameLoop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else if (!reducedMotion && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frameLoop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!reducedMotion) {
      raf = requestAnimationFrame(frameLoop);
    }

    return () => {
      applyThemeRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteProgram(program);
    };
  }, [band]);

  useEffect(() => {
    applyThemeRef.current?.(mesh, deep);
  }, [mesh, deep]);

  return <canvas ref={canvasRef} className={className} />;
}
