import { useEffect, useRef, useState } from "react";
import { DepthPortrait } from "./DepthPortrait";

const GO_SNIPPET = `// ship.go — turn ideas into things that actually run
package main
import ("context"; "log"; "runtime"; "sync")
type Idea struct { Name string; Tags []string; Score float64 }
func (i Idea) Refine() Idea { i.Score = score(i.Tags); return i }
func main() {
  ctx, cancel := context.WithCancel(context.Background())
  defer cancel()
  ideas := make(chan Idea, runtime.NumCPU())
  var wg sync.WaitGroup
  for w := 0; w < runtime.NumCPU(); w++ {
    wg.Add(1)
    go func(worker int) {
      defer wg.Done()
      for idea := range ideas {
        if err := ship(ctx, idea); err != nil {
          log.Printf("worker %d dropped %s: %v", worker, idea.Name, err)
          continue
        }
        log.Printf("worker %d shipped %s", worker, idea.Name)
      }
    }(w)
  }
  for _, idea := range brain.Wander(ctx) {
    select {
    case ideas <- idea.Refine():
    case <-ctx.Done():
      return
    }
  }
  close(ideas)
  wg.Wait()
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

const LENS_CHASE = 0.085;

export const HeroPortrait: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const splashRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const target = useRef({ x: 50, y: 50 });
  const current = useRef({ x: 50, y: 50 });
  const raf = useRef(0);

  const readCursor = (e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const startChase = () => {
    if (raf.current) return;
    const step = () => {
      const splash = splashRef.current;
      if (!splash) return;
      current.current.x += (target.current.x - current.current.x) * LENS_CHASE;
      current.current.y += (target.current.y - current.current.y) * LENS_CHASE;
      splash.style.setProperty("--sx", `${current.current.x}%`);
      splash.style.setProperty("--sy", `${current.current.y}%`);
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
          current.current = { ...p };
        }
        setActive(true);
        startChase();
      }}
      onPointerMove={(e) => {
        const p = readCursor(e);
        if (p) target.current = p;
      }}
      onPointerLeave={() => {
        setActive(false);
        stopChase();
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
