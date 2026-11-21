// The POS terminal's React side: switches the screen between idle and the live shell with
// the scene's phase, runs the shell, and hands the keyboard to Neovim while it's open.
// The canvas, layout and commands are in posScreen.ts; Neovim is posVim.ts.
import { useEffect, useRef } from "react";
import { complete, drawIdle, drawTerminal, echo, hiddenInput, listRow, run, setOpen, type Row, type ShellCtx } from "./posScreen";
import { drawVim, openVim, vimKey, type VimState } from "./posVim";
import { PALETTE as C } from "./data";

/** Name a key the way posVim expects: "j", "Enter", "Escape", "C-d", … (null = not ours). */
function vimName(e: KeyboardEvent): string | null {
  if (e.ctrlKey && (e.key === "d" || e.key === "u")) return `C-${e.key}`;
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key.length === 1) return e.key;
  if (["Enter", "Escape", "Backspace", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return e.key;
  return null;
}

/**
 * `open`: the screen shows the shell (from the start of the zoom). `typing`: keys go to it
 * (once the camera has arrived). `onExit`: the `exit` command. `onOpen`: `./<project>`.
 */
export function PosTerminal({ open, typing, onExit, onOpen }: { open: boolean; typing: boolean; onExit: () => void; onOpen: (path: string) => void }) {
  const history = useRef<Row[]>([[{ t: "type help to see what's here", c: C.mut }]]);
  const past = useRef<string[]>([]); // lines entered, for ↑ / ↓
  const vim = useRef<VimState | null>(null);
  const typingNow = useRef(typing);
  typingNow.current = typing;
  const ctx = useRef<ShellCtx>({ exit: onExit, open: onOpen, vim: () => {} });

  useEffect(() => {
    setOpen(open);
    if (!open) {
      vim.current = null;
      drawIdle();
      return;
    }
    const el = hiddenInput();
    if (!el) return;
    let on = true;
    let back = -1; // position while stepping through past lines
    const draw = () => (vim.current ? drawVim(vim.current) : drawTerminal(history.current, el.value, on));
    ctx.current.vim = (arg: string) => {
      vim.current = openVim(arg);
    };
    draw();
    const blink = window.setInterval(() => {
      on = !on;
      if (!vim.current) draw();
    }, 530);
    const gap = (): Row[] => (history.current.length ? [[]] : []);

    const toVim = (key: string) => {
      if (!vim.current) return;
      if (vimKey(vim.current, key) === "quit") vim.current = null;
      draw();
    };

    const onInput = () => {
      if (vim.current) {
        // phone keyboards don't send usable keydowns: take the typed characters from here
        const typed = el.value;
        el.value = "";
        for (const ch of typed) toVim(ch);
        return;
      }
      on = true;
      draw();
    };
    const onKey = (e: KeyboardEvent) => {
      if (vim.current) {
        const name = vimName(e);
        if (!name) return;
        e.preventDefault();
        e.stopPropagation(); // Esc belongs to vim here, not to "step back out"
        toVim(name);
        return;
      }
      const k = e.key;
      if (k === "Enter") {
        e.preventDefault();
        const line = el.value;
        el.value = "";
        back = -1;
        if (line.trim()) past.current = [...past.current.filter((l) => l !== line), line].slice(-50);
        if (line.trim() === "clear") history.current = [];
        else history.current = [...history.current, ...gap(), ...echo(line), ...run(line, ctx.current)].slice(-200);
      } else if (k === "Tab") {
        e.preventDefault();
        const r = complete(el.value);
        if (r.list.length) history.current = [...history.current, ...gap(), ...echo(el.value), listRow(r.list)];
        el.value = r.input;
      } else if (k === "ArrowUp" || k === "ArrowDown") {
        e.preventDefault();
        const n = past.current.length;
        if (!n) return;
        if (k === "ArrowUp") back = back < 0 ? n - 1 : Math.max(0, back - 1);
        else back = back < 0 || back + 1 >= n ? -1 : back + 1;
        el.value = back < 0 ? "" : past.current[back];
      } else if (k === "ArrowLeft" || k === "ArrowRight" || k === "Home" || k === "End") {
        e.preventDefault(); // the cursor lives at the end of the line
      } else return;
      el.setSelectionRange(el.value.length, el.value.length);
      on = true;
      draw();
    };
    el.addEventListener("input", onInput);
    el.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(blink);
      el.removeEventListener("input", onInput);
      el.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    ctx.current.exit = onExit;
    ctx.current.open = onOpen;
  }, [onExit, onOpen]);

  // keys go to the terminal only once we're there; leaving drops focus. A click anywhere
  // (on the screen, the canvas) takes focus off the hidden input, so take it straight back.
  useEffect(() => {
    const el = hiddenInput();
    if (!el) return;
    if (!typing) {
      el.blur();
      el.value = "";
      return;
    }
    // (after the click's own handling: a click outside steps back out, and then we mustn't)
    const refocus = () => window.setTimeout(() => typingNow.current && el.focus({ preventScroll: true }), 0);
    el.focus({ preventScroll: true });
    window.addEventListener("pointerup", refocus);
    return () => window.removeEventListener("pointerup", refocus);
  }, [typing]);

  return null;
}
