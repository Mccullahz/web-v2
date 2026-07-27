import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";

function getInitialTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const Header: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const navLinks = (
    <>
      <li>
        <a href="/#home" onClick={() => setNavOpen(false)} className="relative font-poppins font-medium text-mut transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-acc after:transition-[width] after:duration-300 hover:text-acc hover:after:w-full">
          Home
        </a>
      </li>
      <li>
        <Link to="/gui" onClick={() => setNavOpen(false)} className="relative font-poppins font-medium text-mut transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-acc after:transition-[width] after:duration-300 hover:text-acc hover:after:w-full">
          Portfolio
        </Link>
      </li>
      <li>
        <a href="/#workexp" onClick={() => setNavOpen(false)} className="relative font-poppins font-medium text-mut transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-acc after:transition-[width] after:duration-300 hover:text-acc hover:after:w-full">
          Experience
        </a>
      </li>
      <li>
        <a href="/#contact" onClick={() => setNavOpen(false)} className="relative font-poppins font-medium text-mut transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-acc after:transition-[width] after:duration-300 hover:text-acc hover:after:w-full">
          Contact
        </a>
      </li>
    </>
  );

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        {/* logo */}
        <Link to="/" className="font-poppins text-2xl font-bold leading-none text-ink">
          mccullah<span className="text-acc">.</span>z
        </Link>

        <div className="flex items-center gap-4">
          {/* desktop nav */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-8 font-mono text-sm">{navLinks}</ul>
          </nav>

          {/* theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-acc hover:text-acc"
          >
            {theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />}
          </button>

          {/* hamburger */}
          <button
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
            className="relative flex h-10 w-10 flex-col items-center justify-center gap-1 md:hidden"
          >
            <span className={`block h-[2px] w-6 bg-ink transition-transform duration-300 ${navOpen ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-6 bg-ink transition-opacity duration-300 ${navOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] w-6 bg-ink transition-transform duration-300 ${navOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* mobile nav */}
      <nav
        className={`overflow-hidden border-t border-line bg-bg transition-all duration-300 md:hidden ${
          navOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-6 px-6 py-6 font-mono">{navLinks}</ul>
      </nav>
    </header>
  );
};
