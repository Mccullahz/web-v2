import React from "react";
import { IoLogoLinkedin, IoLogoGithub } from "react-icons/io5";

export const Footer: React.FC = () => (
  <footer className="border-t border-line bg-surf py-10">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
      <a
        href="https://github.com/Mccullahz/web-v2"
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-mut transition-colors hover:text-acc"
        aria-label="Source Code"
      >
        © 2026 · Powered by ZyGuy
      </a>

      <ul className="flex items-center gap-6">
        <li>
          <a
            href="https://www.linkedin.com/in/zylar-mccullah-b4654420a/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl text-mut transition-colors hover:text-acc"
            aria-label="LinkedIn"
          >
            <IoLogoLinkedin />
          </a>
        </li>
        <li>
          <a
            href="https://github.com/Mccullahz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl text-mut transition-colors hover:text-acc"
            aria-label="GitHub"
          >
            <IoLogoGithub />
          </a>
        </li>
      </ul>
    </div>
  </footer>
);
