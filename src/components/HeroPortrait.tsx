import { useEffect, useRef } from "react";

const PHOTO_SRC = "/images/headshot-cut.webp";
const ALT =
  "Headshot of the author, a smiling short man, maybe... very short? No, it can't be that... perhaps, he's jsut sitting down. yes it MUST be that... He's sitting down, end of monologue, apologies screen reader";

const GO_SNIPPET = `
// startSession folds any guest cart into the account, rotates the session id,
// and sets the cookie. Shared by signin and post-verification sign-in.
func (h *Handler) startSession(w http.ResponseWriter, r *http.Request, user *User) bool {
	// if the caller was shopping as a guest, fold their guest cart into this account, then invalidate the guest session (also prevents session fixation).
	if old, cerr := r.Cookie("session"); cerr == nil {
		if guestID, gerr := h.Service.UserIDFromSession(r.Context(), old.Value); gerr == nil && guestID != user.ID {
			if gu, uerr := h.Service.UserByID(r.Context(), guestID); uerr == nil && gu != nil && gu.IsGuest {
				_ = h.Service.MergeGuestCart(r.Context(), guestID, user.ID)
			}
		}
		_ = h.Service.SignOut(r.Context(), old.Value)
	}

	sessionID, err := h.Service.CreateSession(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return false
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.SecureCookie, // configurable based on environment
	})
	return true
}`;

// the portrait is typeset from the function body in reading order; comments
// would read as noise in the face, so they're dropped before laying out
const GLYPH_TEXT = GO_SNIPPET.replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ").trim() + " ";

// working resolution for sampling the photo; same aspect as the 606x768 portrait
const PW = 300;
const PH = 380;
const REPEL = 2.4; // push strength at the centre of the pointer
const SPRING = 0.055; // pull back toward each glyph's home cell
const DAMP = 0.8;
const INTRO_MS = 2600; // length of the one-off sweep that shows the effect on load
const LENS_EASE = 0.12; // how quickly the lens opens on hover and closes on leave

interface Glyph {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ch: string;
  color: string; // quantised photo colour, so fills can be batched
  rgb: [number, number, number];
}

function hexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// the load-time sweep: one eased pass left to right across the face, p = 0..1
function sweep(p: number): [number, number] {
  const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  return [0.26 + 0.48 * e, 0.36 - 0.07 * Math.sin(Math.PI * e)];
}

/**
 * "Source portrait": the headshot rendered entirely as glyphs of the Go snippet,
 * each coloured by the photo pixel beneath it. Glyphs near the pointer spring
 * aside and the real photo shows through the gap.
 */
export const HeroPortrait: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = document.createElement("canvas");
    reveal.width = PW;
    reveal.height = PH;
    const rx = reveal.getContext("2d")!;

    let photoImg: HTMLImageElement | null = null;
    let photo: Uint8ClampedArray | null = null;
    let glyphs: Glyph[] = [];
    let W = 0;
    let H = 0;
    let CH = 0;
    let dark = true;
    let acc = "#d3a99f";
    let font = "monospace";
    const ptr = { x: 0.5, y: 0.4, px: 0.5, py: 0.4, inside: false };
    let lens = 0; // 0 = closed, 1 = fully open
    let introStart = -1; // set once the photo is ready; stays -1 with reduced motion
    let settled = true;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      const bg = hexRgb(cs.getPropertyValue("--color-bg"));
      dark = bg[0] + bg[1] + bg[2] < 300;
      acc = cs.getPropertyValue("--color-acc").trim() || acc;
      font = cs.getPropertyValue("--font-mono").trim() || font;
      // light theme darkens the swatches so the white shirt still reads against a pale ground
      const k = dark ? 1 : 0.62;
      for (const g of glyphs) g.color = `rgb(${(g.rgb[0] * k) | 0},${(g.rgb[1] * k) | 0},${(g.rgb[2] * k) | 0})`;
    };

    const at = (x: number, y: number) =>
      Math.max(0, Math.min(PH - 1, y | 0)) * PW + Math.max(0, Math.min(PW - 1, x | 0));

    const layout = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!photo || !W) return;

      const CW = Math.max(4.6, W / 76);
      CH = CW * 1.5;
      const q = (v: number) => Math.min(255, Math.round(v / 32) * 32);
      glyphs = [];
      let k = 0;
      for (let y = CH * 0.5; y < H; y += CH) {
        for (let x = CW * 0.5; x < W; x += CW) {
          const i = at((x / W) * PW, (y / H) * PH);
          if (photo[i * 4 + 3] < 128) continue;
          const ch = GLYPH_TEXT[k++ % GLYPH_TEXT.length];
          if (ch === " ") continue;
          glyphs.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, ch, color: "", rgb: [q(photo[i * 4]), q(photo[i * 4 + 1]), q(photo[i * 4 + 2])] });
        }
      }
      readTheme();
    };

    const frame = (t: number) => {
      if (!photoImg) return;
      const intro = introStart >= 0 && t - introStart < INTRO_MS && !ptr.inside;
      const [tx, ty] = intro ? sweep((t - introStart) / INTRO_MS) : [ptr.x, ptr.y];
      ptr.px += (tx - ptr.px) * (intro ? 0.2 : 0.35);
      ptr.py += (ty - ptr.py) * (intro ? 0.2 : 0.35);
      // the lens only exists during the sweep and while hovered; otherwise it closes
      lens += ((intro || ptr.inside ? 1 : 0) - lens) * LENS_EASE;
      if (lens < 0.005) lens = 0;
      const px = ptr.px * W;
      const py = ptr.py * H;
      const R = W * 0.17 * lens;

      ctx.clearRect(0, 0, W, H);

      // the real photo sits under the code and shows only where the code has moved away
      if (lens > 0) {
        rx.globalCompositeOperation = "source-over";
        rx.clearRect(0, 0, PW, PH);
        rx.drawImage(photoImg, 0, 0, PW, PH);
        rx.globalCompositeOperation = "destination-in";
        const gr = rx.createRadialGradient(ptr.px * PW, ptr.py * PH, 0, ptr.px * PW, ptr.py * PH, (R / W) * PW * 1.05);
        gr.addColorStop(0, "rgba(0,0,0,1)");
        gr.addColorStop(0.6, "rgba(0,0,0,.85)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        rx.fillStyle = gr;
        rx.fillRect(0, 0, PW, PH);
        ctx.drawImage(reveal, 0, 0, W, H);
      }

      const buckets = new Map<string, Glyph[]>();
      const moved: Glyph[] = [];
      for (const g of glyphs) {
        const dx = g.x - px;
        const dy = g.y - py;
        const d = Math.hypot(dx, dy) || 1;
        if (d < R) {
          const f = (1 - d / R) * REPEL;
          g.vx += (dx / d) * f;
          g.vy += (dy / d) * f;
        }
        g.vx = (g.vx + (g.hx - g.x) * SPRING) * DAMP;
        g.vy = (g.vy + (g.hy - g.y) * SPRING) * DAMP;
        g.x += g.vx;
        g.y += g.vy;
        if (Math.abs(g.x - g.hx) + Math.abs(g.y - g.hy) > 2.5) moved.push(g);
        else {
          let list = buckets.get(g.color);
          if (!list) buckets.set(g.color, (list = []));
          list.push(g);
        }
      }

      ctx.font = `${(CH * 0.86).toFixed(1)}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      buckets.forEach((list, color) => {
        ctx.fillStyle = color;
        for (const g of list) ctx.fillText(g.ch, g.x, g.y);
      });
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = acc;
      for (const g of moved) ctx.fillText(g.ch, g.x, g.y);
      ctx.globalAlpha = 1;
      settled = !intro && !ptr.inside && lens === 0 && moved.length === 0;

      if (readoutRef.current) {
        readoutRef.current.innerHTML = `startSession() · <b class="font-normal text-acc">${glyphs.length}</b> glyphs · ${moved.length} displaced`;
      }
    };

    // only animate while on screen and something is actually moving: the sweep,
    // a hover, or glyphs still springing home after one
    let raf = 0;
    let visible = false;
    const shouldRun = () => visible && !document.hidden && !settled;
    const tick = (t: number) => {
      frame(t);
      raf = shouldRun() ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && photo) raf = requestAnimationFrame(tick);
    };

    const readPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = (e.clientX - r.left) / r.width;
      ptr.y = (e.clientY - r.top) / r.height;
      // a closed lens opens where the pointer is instead of sliding over from its last spot
      if (lens === 0) {
        ptr.px = ptr.x;
        ptr.py = ptr.y;
      }
      settled = false;
      kick();
    };
    const onEnter = () => {
      ptr.inside = true;
      settled = false;
    };
    const onLeave = () => {
      ptr.inside = false;
      kick();
    };
    const onDown = (e: PointerEvent) => {
      ptr.inside = true;
      readPointer(e);
    };
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointermove", readPointer);
    root.addEventListener("pointerdown", onDown);
    document.addEventListener("visibilitychange", kick);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      layout();
      // a still frame when nothing is animating, so the portrait is never blank
      if (!raf) frame(performance.now());
    });
    ro.observe(canvas);

    // theme can flip from the header toggle (data-theme) or the OS
    // the loop is usually idle, so repaint once by hand after re-reading the colours
    const onTheme = () => {
      readTheme();
      if (!raf) frame(performance.now());
    };
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    let cancelled = false;
    const img = new Image();
    img.src = PHOTO_SRC;
    img
      .decode()
      .then(() => {
        if (cancelled) return;
        const c = document.createElement("canvas");
        c.width = PW;
        c.height = PH;
        const x = c.getContext("2d", { willReadFrequently: true })!;
        x.drawImage(img, 0, 0, PW, PH);
        photo = x.getImageData(0, 0, PW, PH).data;
        photoImg = img;
        layout();
        if (!reduce) {
          introStart = performance.now();
          settled = false;
        }
        frame(performance.now());
        kick();
      })
      .catch(() => {
        /* leave the canvas empty; the alt text still describes it */
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", onTheme);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointermove", readPointer);
      root.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", kick);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-reveal
      style={{ transitionDelay: "120ms" }}
      className="relative mx-auto w-full max-w-[420px] cursor-crosshair md:order-last md:mx-0 md:-ml-14 md:mb-10"
    >
      {/* pan-y keeps page scrolling on touch; the bottom fade dissolves the cropped torso */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ALT}
        className="block aspect-[606/768] w-full touch-pan-y [mask-image:linear-gradient(to_top,transparent,#000_14%)]"
      />
      <div
        ref={readoutRef}
        aria-hidden="true"
        className="mt-2 whitespace-nowrap text-center font-mono text-[11px] text-faint"
      />
    </div>
  );
};
