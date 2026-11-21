// The POS tablet's screen: a little terminal, laid out like Zylar's own (a two-line prompt,
// no title bar, a thin border, a tmux-style tab strip along the bottom). The screen mesh
// (pos_screen in room.glb) shows this module's canvas. Closed, it's an idle prompt; open
// (the camera zoomed onto it), it's a shell you can type into.
//
// Typing goes through a hidden <input> so phone keyboards and IMEs work; it's focused from
// the click that opens the terminal, which mobile browsers require before showing a keyboard.
// The React side (PosTerminal.tsx) drives all of this from the scene's phase.
//
// Commands live in COMMANDS below. Everything is laid out on a character grid (the font is
// monospaced), so wrapping and columns are counted in characters.
import * as THREE from "three";
import { ART_LINES, FACTS, STACK } from "../../data/stack";
import { PALETTE as C, PROJECTS } from "./data";

const W = 1024;
const H = 704; // the screen is 24.6 × 16.8 cm
const PAD = 26;
const PX = 16;
const LINE = 21;
const TAB_H = 30;
const BORDER = 3;
const FONT = `400 ${PX}px 'DM Mono', ui-monospace, monospace`;
const BOLD = `500 ${PX}px 'DM Mono', ui-monospace, monospace`;
const ITALIC = `italic 400 ${PX - 1}px 'DM Mono', ui-monospace, monospace`;
const ITALIC_TXT = `italic 400 ${PX}px 'DM Mono', ui-monospace, monospace`;

export const USER = "gst@zylarmccullah.tech";
const CWD = "~/cafe";
const BRANCH = "main*";
const TABS = ["nvim .", "zsh in cafe", "npm run dev"];
export const TAB_NVIM = 0;
export const TAB_SHELL = 1;

const PATH_BLUE = "#6f9fd8";

// ---- rows: a line of coloured segments ----
export interface Seg {
  t: string;
  c?: string;
  b?: boolean;
  i?: boolean;
  bg?: string;
}
export type Row = Seg[];
export const plain = (t: string, c: string = C.ink): Row => [{ t, c }];

/** A painted line: its segments plus an optional full-width background (cursor line, statusline). */
export interface Line {
  segs: Seg[];
  bg?: string;
}
export interface Caret {
  row: number;
  col: number;
  kind: "bar" | "block";
}

/** the first prompt line, as printed above each command */
const promptHead = (): Row => [
  { t: USER, c: C.acc2, b: true },
  { t: ` ${CWD}`, c: PATH_BLUE },
  { t: ` ${BRANCH}`, c: C.ink },
];
const promptLine = (input: string): Row => [
  { t: "❯ ", c: C.acc, b: true },
  { t: input, c: C.ink },
];

// ---- the shared screen canvas (Room puts this texture on pos_screen) ----
const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
if (canvas) {
  canvas.width = W;
  canvas.height = H;
}
export const posScreenTexture = (() => {
  const t = new THREE.CanvasTexture(canvas ?? undefined);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.flipY = false; // the screen's UVs run top-down (v = 0 at the top edge)
  return t;
})();

let cw = PX * 0.6; // one character's width, measured once the font is in
export const COLS = () => Math.floor((W - 2 * PAD) / cw);
export const ROWS = Math.floor((H - TAB_H - 2 * PAD + 6) / LINE);

/** Break a row into rows of at most `cols` characters, keeping each segment's colour. */
function wrapRow(row: Row, cols: number): Row[] {
  const out: Row[] = [];
  let cur: Row = [];
  let n = 0;
  for (const s of row) {
    let rest = s.t;
    while (rest.length) {
      const room = cols - n;
      if (room <= 0) {
        out.push(cur);
        cur = [];
        n = 0;
        continue;
      }
      const piece = rest.slice(0, room);
      cur.push({ ...s, t: piece });
      n += piece.length;
      rest = rest.slice(piece.length);
    }
  }
  out.push(cur);
  return out;
}

/** Word-wrap plain text to `cols` characters. */
function words(text: string, cols: number) {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > cols && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  lines.push(line);
  return lines;
}

function background(x: CanvasRenderingContext2D) {
  x.fillStyle = "#0a0d09";
  x.fillRect(0, 0, W, H);
  // a faint rose glow, the room's neon standing in for a wallpaper
  const g = x.createRadialGradient(W * 0.62, H * 0.42, 0, W * 0.62, H * 0.42, W * 0.6);
  g.addColorStop(0, "rgba(211,169,159,0.10)");
  g.addColorStop(1, "rgba(211,169,159,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
}

function tabs(x: CanvasRenderingContext2D, active: number) {
  const y = H - TAB_H - BORDER;
  let tx = PAD - 8;
  TABS.forEach((label, i) => {
    const on = i === active;
    x.font = on ? ITALIC : FONT;
    const w = x.measureText(label).width + 28;
    x.fillStyle = on ? "#d9d2c8" : "#1a1f18";
    x.fillRect(tx, y + 5, w, TAB_H - 10);
    x.fillStyle = on ? "#0a0d09" : C.mut;
    x.fillText(label, tx + 14, y + TAB_H / 2 + 5);
    tx += w + 10;
  });
}

function border(x: CanvasRenderingContext2D) {
  x.strokeStyle = C.acc;
  x.lineWidth = BORDER;
  x.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, H - BORDER);
}

const baseline = (row: number) => PAD + 14 + row * LINE;

function drawLines(x: CanvasRenderingContext2D, lines: Line[], caret: Caret | null) {
  x.textBaseline = "alphabetic";
  lines.forEach((ln, row) => {
    const y = baseline(row);
    const top = y - 15;
    if (ln.bg) {
      x.fillStyle = ln.bg;
      x.fillRect(PAD - 8, top, W - 2 * PAD + 16, LINE);
    }
    let col = 0;
    for (const s of ln.segs) {
      const px = PAD + col * cw;
      if (s.bg) {
        x.fillStyle = s.bg;
        x.fillRect(px, top, s.t.length * cw, LINE);
      }
      x.font = s.b ? BOLD : s.i ? ITALIC_TXT : FONT;
      x.fillStyle = s.c ?? C.ink;
      x.fillText(s.t, px, y);
      col += s.t.length;
    }
  });
  if (caret) {
    const px = PAD + caret.col * cw;
    const y = baseline(caret.row);
    x.fillStyle = C.acc2;
    if (caret.kind === "bar") x.fillRect(px + 1, y - PX + 2, 2, PX + 2);
    else {
      x.globalAlpha = 0.7;
      x.fillRect(px, y - 15, cw, LINE);
      x.globalAlpha = 1;
    }
  }
}

/** Paint a full screen of lines (at most ROWS), with the tab strip and border. */
export function paintLines(lines: Line[], caret: Caret | null, activeTab = TAB_SHELL) {
  const x = canvas?.getContext("2d");
  if (!x) return;
  x.font = FONT;
  cw = x.measureText("M").width || cw;
  background(x);
  drawLines(x, lines, caret);
  tabs(x, activeTab);
  border(x);
  posScreenTexture.needsUpdate = true;
}

/** The shell: rows wrapped to the width, the latest ones shown, a bar cursor at the end. */
function paint(rows: Row[], cursor: boolean) {
  const x = canvas?.getContext("2d");
  if (x) {
    x.font = FONT;
    cw = x.measureText("M").width || cw;
  }
  const lines = rows.flatMap((r) => wrapRow(r, COLS())).slice(-ROWS);
  const last = lines[lines.length - 1] ?? [];
  const col = last.reduce((n, s) => n + s.t.length, 0);
  paintLines(
    lines.map((segs) => ({ segs })),
    cursor ? { row: lines.length - 1, col, kind: "bar" } : null,
  );
}

/** The view: everything run so far, then a fresh two-line prompt. */
function screenRows(history: Row[], input: string) {
  return [...history, ...(history.length ? [[] as Row] : []), promptHead(), promptLine(input)];
}

export function drawIdle() {
  paint(screenRows([], ""), false);
}

export function drawTerminal(history: Row[], input: string, cursorOn: boolean) {
  paint(screenRows(history, input), cursorOn);
}

// ---- commands ----
const cssVar = (name: string, fallback: string) => {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  } catch {
    return fallback;
  }
};

/** neofetch: the same art and stack as the skills section, art on the left. */
function neofetch(): Row[] {
  const artW = Math.max(...ART_LINES.map((l) => l.length)) + 2;
  const infoCols = Math.max(20, COLS() - artW);
  const LABEL = 11; // "LANGUAGES" + padding
  const info: Row[] = [[{ t: USER, c: C.acc2, b: true }], plain("─".repeat(USER.length), C.mut)];
  for (const [k, v] of FACTS) info.push(...words(v, infoCols - LABEL - 2).map((l, i) => [{ t: (i ? "" : k).padEnd(LABEL), c: C.acc2, b: true }, { t: i ? "  " : "→ ", c: C.mut }, { t: l, c: C.ink }]));
  info.push([]);
  for (const g of STACK) {
    const tone = cssVar(g.tone, C.acc);
    const list = g.tools.map((t) => t.toLowerCase()).join(", ");
    info.push(...words(list, infoCols - LABEL - 2).map((l, i) => [{ t: (i ? "" : g.label).padEnd(LABEL), c: tone, b: true }, { t: i ? "  " : "→ ", c: C.mut }, { t: l, c: C.ink }]));
  }
  info.push([]);
  const swatches = ["--color-surf2", "--color-line", "--color-faint", "--color-mut", "--color-ink", "--stack-c4", "--stack-c3", "--color-acc", "--color-acc2"];
  info.push(swatches.map((v) => ({ t: "███ ", c: cssVar(v, C.mut) })));
  const n = Math.max(ART_LINES.length, info.length);
  // centre the info block against the art
  const top = Math.max(0, Math.floor((ART_LINES.length - info.length) / 2));
  return Array.from({ length: n }, (_, k) => [{ t: (ART_LINES[k] ?? "").padEnd(artW), c: C.acc }, ...(info[k - top] ?? [])]);
}

function ls(): Row[] {
  const row: Row = [];
  PROJECTS.forEach((p, i) => {
    row.push({ t: p.slug, c: C.acc2, b: true }, { t: "*", c: C.mut });
    if (i < PROJECTS.length - 1) row.push({ t: "  " });
  });
  return [row];
}

const findProject = (name: string) => PROJECTS.find((p) => p.slug === name || p.title === name);

export interface ShellCtx {
  exit: () => void;
  /** open a site route (a project page) */
  open: (path: string) => void;
  /** start Neovim on a path ("." = ~/cafe) */
  vim: (arg: string) => void;
}

export const COMMANDS: Record<string, (args: string[], ctx: ShellCtx) => Row[]> = {
  help: () => [
    plain("neofetch      the stack, as fetched", C.ink),
    plain("ls            the projects in this café", C.ink),
    plain("nvim .        browse them (each has a README)", C.ink),
    plain("./<project>   open one, e.g. ./" + PROJECTS[0].slug, C.ink),
    plain("clear         clear the screen", C.ink),
    plain("exit          step back from the counter", C.ink),
  ],
  neofetch: () => neofetch(),
  fastfetch: () => neofetch(),
  ls: () => ls(),
  nvim: (args, ctx) => (ctx.vim(args[0] ?? "."), []),
  vim: (args, ctx) => (ctx.vim(args[0] ?? "."), []),
  vi: (args, ctx) => (ctx.vim(args[0] ?? "."), []),
  exit: (_, ctx) => (ctx.exit(), []),
};

/** Run one line; `clear` is handled by the caller since it empties the history. */
export function run(line: string, ctx: ShellCtx): Row[] {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (!cmd) return [];
  if (cmd.startsWith("./")) {
    const name = cmd.slice(2).replace(/\/$/, "");
    const p = findProject(name);
    if (!p) return [plain(`zsh: no such file or directory: ${cmd}`, C.mut)];
    window.setTimeout(() => ctx.open(p.path), 450); // a beat to read it
    return [[{ t: "opening ", c: C.mut }, { t: p.title, c: C.acc2, b: true }, { t: " …", c: C.mut }]];
  }
  const fn = COMMANDS[cmd];
  if (fn) return fn(args, ctx);
  if (findProject(cmd)) return [plain(`zsh: command not found: ${cmd}`, C.mut), plain(`did you mean ./${findProject(cmd)!.slug}?`, C.mut)];
  return [plain(`zsh: command not found: ${cmd}`, C.mut)];
}

/** Tab completion: commands, and ./<project>. Returns the new input and any candidates to list. */
export function complete(input: string): { input: string; list: string[] } {
  // `nvim fl<tab>` → `nvim flacer/`
  const m = /^(n?vim?|vi)\s+(\S*)$/.exec(input);
  if (m) {
    const hits = PROJECTS.map((p) => `${p.slug}/`).filter((d) => d.startsWith(m[2]));
    if (hits.length === 1) return { input: `${m[1]} ${hits[0]}`, list: [] };
    return { input, list: hits.length > 1 ? hits : [] };
  }
  const [head] = input.split(" ");
  if (input.includes(" ")) return { input, list: [] };
  const pool = head.startsWith("./") ? PROJECTS.map((p) => `./${p.slug}`) : [...Object.keys(COMMANDS), "clear", "./"];
  const hits = pool.filter((c) => c.startsWith(head));
  if (hits.length === 1) return { input: hits[0] === "./" ? "./" : hits[0] + " ", list: [] };
  if (!hits.length) return { input, list: [] };
  // extend to the longest shared prefix, list the rest
  let pre = hits[0];
  for (const h of hits) while (!h.startsWith(pre)) pre = pre.slice(0, -1);
  return { input: pre.length > head.length ? pre : input, list: pre.length > head.length ? [] : hits };
}

/** The row a command line is echoed as in the history (prompt head + ❯ line). */
export const echo = (line: string): Row[] => [promptHead(), promptLine(line)];
export const listRow = (items: string[]): Row => items.flatMap((t, i) => [{ t, c: C.acc2 }, ...(i < items.length - 1 ? [{ t: "  " }] : [])]);

let isOpen = false;
export const setOpen = (o: boolean) => void (isOpen = o);
drawIdle();
// redraw in the real fonts once they've loaded
if (typeof document !== "undefined")
  Promise.all([`400 ${PX}px 'DM Mono'`, `500 ${PX}px 'DM Mono'`].map((f) => document.fonts.load(f)))
    .catch(() => undefined)
    .then(() => !isOpen && drawIdle());

// ---- typing ----
let input: HTMLInputElement | null = null;
export function hiddenInput() {
  if (!input && typeof document !== "undefined") {
    input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "café terminal input");
    Object.assign(input.style, { position: "fixed", left: "0", bottom: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    document.body.appendChild(input);
  }
  return input;
}

/** Call from the click that opens the terminal, so mobile browsers bring up the keyboard. */
export function focusPosInput() {
  hiddenInput()?.focus({ preventScroll: true });
}

/** True while the visitor is typing into a text field (the terminal or anything else). */
export const isTypingTarget = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
