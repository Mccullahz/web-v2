import { useEffect, useRef, useState } from "react";
import { DepthPortrait } from "./DepthPortrait";

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

const TOKENS =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|`[^`]*`)|\b(package|import|func|go|defer|for|range|if|else|return|chan|select|case|switch|type|struct|interface|var|const|map|nil|true|false|continue|break)\b|\b(make|close|len|cap|append|new|panic|string)\b/g;

function highlightGo(src: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of src.matchAll(TOKENS)) {
    const at = m.index ?? 0;
    if (at > last) out.push(src.slice(last, at));
    const cls = m[1] ? "text-faint" : m[2] ? "text-mut" : m[3] ? "text-acc" : "text-acc2";
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>
    );
    last = at + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

const TRAIL = 10; // lens points: 1 head + 5 tail
const TRAIL_DELAY = 5; // frames of lag between each trailing point
const HEAD_CHASE = 0.16; // how hard the head eases toward the cursor
const HIST = TRAIL * TRAIL_DELAY + 2; // ring-buffer length

export const HeroPortrait: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const splashRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const target = useRef({ x: 50, y: 50 });
  const head = useRef({ x: 50, y: 50 });
  // ring buffer of recent head positions; the tail lenses sample it at a lag
  const histX = useRef<number[]>(new Array(HIST).fill(50));
  const histY = useRef<number[]>(new Array(HIST).fill(50));
  const write = useRef(0);
  const raf = useRef(0);
  const settling = useRef(false);

  const readCursor = (e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const reset = (x: number, y: number) => {
    head.current = { x, y };
    histX.current.fill(x);
    histY.current.fill(y);
    write.current = 0;
  };

  const startChase = () => {
    if (raf.current) return;
    const step = () => {
      const splash = splashRef.current;
      if (!splash) {
        raf.current = 0;
        return;
      }
      head.current.x += (target.current.x - head.current.x) * HEAD_CHASE;
      head.current.y += (target.current.y - head.current.y) * HEAD_CHASE;
      histX.current[write.current] = head.current.x;
      histY.current[write.current] = head.current.y;
      let far = 0; 
      for (let i = 0; i < TRAIL; i++) {
        const idx = ((write.current - i * TRAIL_DELAY) % HIST + HIST) % HIST;
        const x = histX.current[idx];
        const y = histY.current[idx];
        splash.style.setProperty(`--sx${i}`, `${x}%`);
        splash.style.setProperty(`--sy${i}`, `${y}%`);
        const dx = x - target.current.x;
        const dy = y - target.current.y;
        far = Math.max(far, dx * dx + dy * dy);
      }
      write.current = (write.current + 1) % HIST;

      if (settling.current && far < 0.1) {
        settling.current = false;
        setActive(false);
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const stopChase = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  };

  useEffect(() => stopChase, []);

  return (
    <div
      ref={rootRef}
      data-reveal
      style={{ transitionDelay: "120ms" }}
      className="group relative mx-auto w-full max-w-[420px] md:order-last md:mx-0 md:-ml-14"
      onPointerEnter={(e) => {
        const p = readCursor(e);
        if (p) {
          // open where the cursor entered instead of sliding in from the last spot
          target.current = p;
          reset(p.x, p.y);
        }
        settling.current = false;
        setActive(true);
        startChase();
      }}
      onPointerMove={(e) => {
        const p = readCursor(e);
        if (p) target.current = p;
      }}
      onPointerLeave={() => {
        settling.current = true;
        startChase();
      }}
    >
      <div
        className="breathe absolute -inset-x-6 -top-[8%] bottom-[6%] -z-0 rounded-full blur-lg"
        style={{ background: "radial-gradient(58% 58% at 50% 32%, var(--color-glow), transparent 70%)" }}
      />

      <DepthPortrait
        alt="Headshot of the author, a smiling short man, maybe... very short? No, it can't be that... perhaps, he's jsut sitting down. yes it MUST be that... He's sitting down, end of monologue, apologies screen reader"
        className="relative z-10 block aspect-[606/768] w-full transition-transform duration-500 group-hover:-translate-y-1"
      />

      <div
        ref={splashRef}
        data-active={active}
        aria-hidden="true"
        className="code-splash pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <pre className="h-full w-full bg-bg/80 px-3 py-2 font-mono text-[11px] leading-[1.55] text-ink">
          <code>{highlightGo(GO_SNIPPET)}</code>
        </pre>
      </div>
    </div>
  );
};
