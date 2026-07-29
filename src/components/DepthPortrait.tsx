import { useEffect, useRef, useState } from "react";

/**
 * Cursor-tracking portrait. Renders the cut-out headshot on a quad and uses a
 * depth map to fake parallax and relighting, so the face gets a sense of
 * volume as the pointer moves.
 *
 * The depth map drives two things: a per-pixel UV shift (near pixels slide
 * further than far ones) and a surface normal used for a light that follows
 * the cursor. Falls back to a plain <img> when reduced-motion is preferred or
 * WebGL is unavailable, so the headshot is never missing.
 */

const PHOTO_SRC = "/images/headshot-cut.webp";
const DEPTH_SRC = "/images/headshot-depth.webp";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPhoto;
uniform sampler2D uDepth;
uniform vec2 uPointer;   // -1..1, x right / y up, already smoothed
uniform vec3 uAccent;
uniform float uParallax;
uniform float uRelief;
uniform float uLight;

// depth is authored so 0 = far, 1 = near; this plane stays put as things shift
const float PIVOT = 0.62;
// sampling the gradient a few texels out low-passes it: hair detail in the depth
// map is unreliable and shows up as blotchy shading at a one-texel stencil
const float STEP = 3.0 / 512.0;
// facial relief runs ~0.13 over that stencil while the silhouette cliff is far
// steeper; clamping shades the face without blowing out the outline
const float MAX_SLOPE = 0.13;

void main() {
  float d0 = texture2D(uDepth, vUv).r;

  // peek around the subject: near pixels travel against the pointer
  vec2 uv = vUv + uPointer * uParallax * (d0 - PIVOT);

  vec4 photo = texture2D(uPhoto, uv);
  if (photo.a < 0.004) discard;

  // normal from the depth gradient (heightfield: n = normalize(-dz/dx, -dz/dy, 1))
  float dx = texture2D(uDepth, uv + vec2(STEP, 0.0)).r - texture2D(uDepth, uv - vec2(STEP, 0.0)).r;
  float dy = texture2D(uDepth, uv + vec2(0.0, STEP)).r - texture2D(uDepth, uv - vec2(0.0, STEP)).r;
  dx = clamp(dx, -MAX_SLOPE, MAX_SLOPE);
  dy = clamp(dy, -MAX_SLOPE, MAX_SLOPE);
  vec3 n = normalize(vec3(-dx * uRelief, -dy * uRelief, 1.0));

  vec3 L = normalize(vec3(uPointer * 0.9, 0.85));
  float lambert = dot(n, L);
  // reference is lambert on a flat normal, so unmodelled areas (the shirt)
  // hold their original exposure no matter where the pointer sits
  // ('flat' itself is reserved in GLSL, hence the name)
  float flatLambert = L.z;

  vec3 col = photo.rgb * (1.0 + (lambert - flatLambert) * uLight);

  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  col += uAccent * spec * 0.05 * photo.a;

  // dissolve the cropped torso instead of ending on a hard horizontal cut
  float fade = smoothstep(0.0, 0.14, uv.y);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), photo.a * fade);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function makeTexture(gl: WebGLRenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Reads the theme accent so the rim/spec highlight matches light and dark mode. */
function readAccent(el: HTMLElement): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue("--color-acc").trim();
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (!hex) return [0.83, 0.66, 0.62];
  const n = parseInt(hex[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const DepthPortrait: React.FC<{ className?: string; alt: string }> = ({ className, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let raf = 0;

    // target is where the pointer says we should be, current chases it for inertia
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let pointerSeen = false;

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // normalise against a box wider than the canvas so tracking stays gentle
      // while the cursor roams the hero rather than pinning at the edges
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width * 2.2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height * 2.2);
      target.x = Math.max(-1, Math.min(1, nx));
      target.y = Math.max(-1, Math.min(1, -ny));
      pointerSeen = true;
    };

    const onLeave = () => {
      pointerSeen = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let cleanupTheme: (() => void) | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let photoTex: WebGLTexture | null = null;
    let depthTex: WebGLTexture | null = null;

    Promise.all([loadImage(PHOTO_SRC), loadImage(DEPTH_SRC)])
      .then(([photo, depth]) => {
        if (disposed) return;

        const vs = compile(gl, gl.VERTEX_SHADER, VERT);
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        program = gl.createProgram();
        if (!vs || !fs || !program) {
          setFailed(true);
          return;
        }
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(program));
          setFailed(true);
          return;
        }
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.useProgram(program);

        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 3, -1, -1, 3]), // oversized tri covers the quad
          gl.STATIC_DRAW
        );
        const aPos = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        photoTex = makeTexture(gl, photo);
        depthTex = makeTexture(gl, depth);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, photoTex);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depthTex);

        const u = (name: string) => gl.getUniformLocation(program!, name);
        gl.uniform1i(u("uPhoto"), 0);
        gl.uniform1i(u("uDepth"), 1);
        gl.uniform1f(u("uParallax"), 0.026);
        gl.uniform1f(u("uRelief"), 2.4);
        gl.uniform1f(u("uLight"), 0.20);

        const uPointer = u("uPointer");
        const uAccent = u("uAccent");
        const syncAccent = () => {
          gl.useProgram(program);
          gl.uniform3fv(uAccent, readAccent(canvas));
        };
        syncAccent();

        // the site has a manual toggle and honours the OS scheme; track both
        const themeObserver = new MutationObserver(syncAccent);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme", "class"],
        });
        const scheme = window.matchMedia("(prefers-color-scheme: dark)");
        scheme.addEventListener("change", syncAccent);
        cleanupTheme = () => {
          themeObserver.disconnect();
          scheme.removeEventListener("change", syncAccent);
        };

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        resize();

        const frame = () => {
          raf = requestAnimationFrame(frame);
          if (!visible) return;

          if (!pointerSeen) {
            // rest dead-on when there's no pointer, so the default is the
            // straight-on portrait rather than a drifting one
            target.x = 0;
            target.y = 0;
          }
          current.x += (target.x - current.x) * 0.045;
          current.y += (target.y - current.y) * 0.045;

          gl.uniform2f(uPointer, current.x, current.y);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        raf = requestAnimationFrame(frame);
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      ro.disconnect();
      cleanupTheme?.();
      if (photoTex) gl.deleteTexture(photoTex);
      if (depthTex) gl.deleteTexture(depthTex);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  if (failed) {
    return <img src={PHOTO_SRC} alt={alt} className={className} />;
  }

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
};
