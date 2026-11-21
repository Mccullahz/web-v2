// `nvim` on the POS terminal: a small, read-only Neovim over a fake ~/cafe tree. The tree
// is one directory per café project, each holding a README.md written from its data.
//
//   directory (netrw-style)   j/k ↑/↓  move     enter/l  open    -/h  up a level
//   file                      j/k ↑/↓  move     -        back to its directory
//   both                      gg/G  top/bottom  ctrl-d/u  half page
//                             :q :q! :wq :x ZZ ZQ  close the file (back to its directory)
//                             :qa :qa! :qall :wqa :xa  quit Neovim
//                             :e <path>  open   :Ex  this directory   :help
//
// Keys arrive already named ("j", "Enter", "Escape", "C-d", …); vimKey returns "quit" when
// the editor should close.
import { PALETTE as C, PROJECTS } from "./data";
import { COLS, ROWS, TAB_NVIM, paintLines, type Line, type Seg } from "./posScreen";

const BLUE = "#6f9fd8";
const RED = "#d98a7e";
const CURSORLINE = "#161b15";
const STATUS_BG = "#141912";
const HOME = "/home/gst/cafe";

// ---- the tree ----
type Path = string[]; // [] = ~/cafe, ["flacer"] = a project dir, ["flacer", "README.md"] = its readme

function readme(slug: string): string[] {
  const p = PROJECTS.find((q) => q.slug === slug);
  if (!p) return [];
  const wrapTo = Math.max(40, Math.min(84, COLS() - 8));
  const wrap = (text: string) => {
    const out: string[] = [];
    let line = "";
    for (const w of text.split(" ")) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > wrapTo && line) {
        out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
    return out;
  };
  return [
    `# ${p.title}`,
    "",
    `> ${p.line}`,
    "",
    ...wrap(p.blurb),
    "",
    "## stack",
    "",
    ...p.stack.map((s) => `- ${s}`),
    "",
    "## links",
    "",
    `- page:   \`${p.path}\``,
    `- source: ${p.repo.replace(/^https?:\/\/(www\.)?/, "")}`,
    "",
    `run \`./${p.slug}\` from the shell to open it.`,
  ];
}

const isDir = (p: Path) => p.length === 0 || (p.length === 1 && PROJECTS.some((q) => q.slug === p[0]));
const isFile = (p: Path) => p.length === 2 && p[1] === "README.md" && PROJECTS.some((q) => q.slug === p[0]);
const entries = (p: Path): string[] => (p.length === 0 ? PROJECTS.map((q) => `${q.slug}/`) : ["README.md"]);
const show = (p: Path) => (p.length ? `${p.join("/")}${isDir(p) ? "/" : ""}` : ".");

/** Resolve a path typed relative to `from` (a directory): ".", "..", "flacer", "flacer/README.md", "~/cafe/…". */
function resolve(from: Path, arg: string): Path | null {
  let parts = arg.replace(/^~\/cafe\/?/, "").replace(new RegExp(`^${HOME}/?`), "").split("/").filter(Boolean);
  let at: Path = arg.startsWith("~") || arg.startsWith("/") ? [] : [...from];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") at = at.slice(0, -1);
    else at = [...at, part];
  }
  parts = at;
  return isDir(parts) || isFile(parts) ? parts : null;
}

// ---- state ----
export interface VimState {
  path: Path; // what's open: a directory or a file
  cur: number; // cursor line (0-based, in the buffer's lines)
  top: number; // first line on screen
  cmd: string | null; // the ":" line being typed
  msg: { text: string; err?: boolean } | null;
  pending: string; // the first key of gg / ZZ / ZQ
}

const HEADER = 4; // netrw's comment banner lines above the listing

function bufLines(v: VimState): string[] {
  if (isFile(v.path)) return readme(v.path[0]);
  return [
    '" ============================================================================',
    '" Netrw Directory Listing                                        (netrw v173)',
    `"   ${HOME}${v.path.length ? "/" + v.path.join("/") : ""}`,
    '" ============================================================================',
    "../",
    "./",
    ...entries(v.path),
  ];
}

const textRows = () => ROWS - 2; // statusline + command line

export function openVim(arg: string): VimState {
  const target = resolve([], arg || ".") ?? [];
  const v: VimState = { path: target, cur: 0, top: 0, cmd: null, msg: null, pending: "" };
  if (!isFile(target)) v.cur = HEADER + 2; // first real entry
  if (arg && arg !== "." && !resolve([], arg)) v.msg = { text: `"${arg}" not found, showing ~/cafe`, err: true };
  return v;
}

function go(v: VimState, path: Path, cursorOn?: string) {
  v.path = path;
  v.top = 0;
  v.cur = isFile(path) ? 0 : HEADER + 2;
  if (cursorOn) {
    const i = bufLines(v).indexOf(cursorOn);
    if (i >= 0) v.cur = i;
  }
  v.msg = isFile(path) ? { text: `"${show(path)}" [readonly] ${bufLines(v).length}L` } : null;
}

function clampScroll(v: VimState) {
  const n = bufLines(v).length;
  const min = isFile(v.path) ? 0 : HEADER;
  v.cur = Math.max(min, Math.min(n - 1, v.cur));
  const rows = textRows();
  if (v.cur < v.top) v.top = v.cur;
  if (v.cur >= v.top + rows) v.top = v.cur - rows + 1;
}

function up(v: VimState) {
  if (!v.path.length) return void (v.msg = { text: `already at ${HOME}` });
  const from = v.path[0];
  go(v, isFile(v.path) ? [v.path[0]] : [], isFile(v.path) ? "README.md" : `${from}/`);
}

function openUnderCursor(v: VimState) {
  if (isFile(v.path)) return;
  const name = bufLines(v)[v.cur];
  if (!name || v.cur < HEADER) return;
  if (name === "../") return up(v);
  if (name === "./") return go(v, v.path);
  const next = resolve(v.path, name.replace(/\/$/, ""));
  if (next) go(v, next);
}

/** :q and friends close the file back to its directory; only the :qa family leaves Neovim. */
function closeBuffer(v: VimState) {
  if (isFile(v.path)) up(v);
  else v.msg = { text: "this is the file browser: :qa to quit nvim" };
}

function ex(v: VimState, line: string): "quit" | void {
  const [c, ...rest] = line.trim().split(/\s+/);
  const arg = rest.join(" ");
  if (["qa", "qa!", "qall", "qall!", "quitall", "wqa", "wqall", "xa", "xall"].includes(c)) return "quit";
  if (["q", "q!", "quit", "quit!", "wq", "wq!", "x", "x!", "close"].includes(c)) return closeBuffer(v);
  if (c === "w" || c === "w!") return void (v.msg = { text: "E45: 'readonly' option is set (add ! to override)", err: true });
  if (c === "e" || c === "edit") {
    const p = resolve(isFile(v.path) ? [v.path[0]] : v.path, arg || ".");
    return p ? go(v, p) : void (v.msg = { text: `E447: Can't find file "${arg}" in path`, err: true });
  }
  if (c === "Ex" || c === "Explore") return go(v, isFile(v.path) ? [v.path[0]] : v.path);
  if (c === "help" || c === "h") return void (v.msg = { text: "j/k move · enter open · - up · gg/G · :q close file · :qa quit" });
  if (/^\d+$/.test(c)) {
    v.cur = Number(c) - 1;
    return;
  }
  if (c) v.msg = { text: `E492: Not an editor command: ${line.trim()}`, err: true };
}

/** One key. Returns "quit" when Neovim should close. */
export function vimKey(v: VimState, key: string): "quit" | void {
  // the command line
  if (v.cmd !== null) {
    if (key === "Escape") v.cmd = null;
    else if (key === "Enter") {
      const line = v.cmd;
      v.cmd = null;
      if (ex(v, line) === "quit") return "quit";
    } else if (key === "Backspace") v.cmd = v.cmd.length ? v.cmd.slice(0, -1) : null;
    else if (key.length === 1) v.cmd += key;
    clampScroll(v);
    return;
  }
  const half = Math.max(1, Math.floor(textRows() / 2));
  const pend = v.pending;
  v.pending = "";
  v.msg = key === "Escape" ? null : v.msg;
  if (pend === "g" && key === "g") v.cur = 0;
  else if (pend === "Z" && (key === "Z" || key === "Q")) closeBuffer(v);
  else
    switch (key) {
      case "j":
      case "ArrowDown":
        v.cur++;
        break;
      case "k":
      case "ArrowUp":
        v.cur--;
        break;
      case "G":
        v.cur = bufLines(v).length - 1;
        break;
      case "g":
      case "Z":
        v.pending = key;
        break;
      case "C-d":
        v.cur += half;
        v.top += half;
        break;
      case "C-u":
        v.cur -= half;
        v.top = Math.max(0, v.top - half);
        break;
      case "Enter":
      case "l":
      case "ArrowRight":
        openUnderCursor(v);
        break;
      case "-":
        up(v);
        break;
      case "h":
      case "ArrowLeft":
        if (!isFile(v.path)) up(v);
        break;
      case ":":
        v.cmd = "";
        v.msg = null;
        break;
      case "i":
      case "a":
      case "o":
      case "I":
      case "A":
      case "O":
        v.msg = isFile(v.path)
          ? { text: "W10: Warning: Changing a readonly file", err: true }
          : { text: "E21: Cannot make changes, 'modifiable' is off", err: true };
        break;
    }
  clampScroll(v);
}

// ---- drawing ----
function inline(text: string, base: string): Seg[] {
  // `code` in blue, the rest in the line's colour
  return text.split(/(`[^`]*`)/).filter(Boolean).map((t) => (t.startsWith("`") ? { t, c: BLUE } : { t, c: base }));
}

function highlight(v: VimState, line: string): Seg[] {
  if (isFile(v.path)) {
    if (line.startsWith("# ")) return [{ t: line, c: C.acc2, b: true }];
    if (line.startsWith("## ")) return [{ t: line, c: C.acc, b: true }];
    if (line.startsWith("> ")) return [{ t: "> ", c: C.mut }, { t: line.slice(2), c: C.mut, i: true }];
    if (line.startsWith("- ")) return [{ t: "- ", c: C.acc }, ...inline(line.slice(2), C.ink)];
    return inline(line, C.ink);
  }
  if (line.startsWith('"')) return [{ t: line, c: "#5f665a", i: true }];
  if (line.endsWith("/")) return [{ t: line, c: BLUE, b: true }];
  return [{ t: line, c: C.ink }];
}

export function drawVim(v: VimState) {
  const lines = bufLines(v);
  const rows = textRows();
  const cols = COLS();
  const out: Line[] = [];
  const gutter = String(lines.length).length + 2;
  for (let r = 0; r < rows; r++) {
    const i = v.top + r;
    if (i >= lines.length) {
      out.push({ segs: [{ t: "~", c: "#3a4036" }] });
      continue;
    }
    const here = i === v.cur;
    const num = String(i + 1).padStart(gutter - 1) + " ";
    const body = highlight(v, lines[i].slice(0, cols - gutter));
    out.push({ segs: [{ t: num, c: here ? C.acc2 : "#4a5045", b: here }, ...body], bg: here ? CURSORLINE : undefined });
  }
  // statusline: mode block, name, then position on the right
  const mode = v.cmd !== null ? " COMMAND " : " NORMAL ";
  const name = ` ${isFile(v.path) ? v.path.join("/") : show(v.path)}${isFile(v.path) ? " [RO]" : ""} `;
  const pct = lines.length <= rows ? "All" : v.top === 0 ? "Top" : v.top + rows >= lines.length ? "Bot" : `${Math.round((v.top / (lines.length - rows)) * 100)}%`;
  const right = ` ${isFile(v.path) ? "markdown" : "netrw"}  utf-8  ${v.cur + 1}:1  ${pct} `;
  const fill = Math.max(1, cols - mode.length - name.length - right.length);
  out.push({
    segs: [
      { t: mode, c: "#0a0d09", b: true, bg: v.cmd !== null ? C.acc2 : C.acc },
      { t: name, c: C.ink, b: true },
      { t: " ".repeat(fill) },
      { t: right, c: C.mut },
    ],
    bg: STATUS_BG,
  });
  // command line / messages
  if (v.cmd !== null) out.push({ segs: [{ t: ":" + v.cmd, c: C.ink }] });
  else if (v.msg) out.push({ segs: [{ t: v.msg.text.slice(0, cols), c: v.msg.err ? RED : C.mut }] });
  else out.push({ segs: [] });

  const gutterCol = gutter;
  const caret =
    v.cmd !== null
      ? { row: rows + 1, col: v.cmd.length + 1, kind: "bar" as const }
      : { row: v.cur - v.top, col: gutterCol, kind: "block" as const };
  paintLines(out, caret, TAB_NVIM);
}
