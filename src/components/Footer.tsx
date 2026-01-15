import React from "react";
import { IoLogoLinkedin, IoLogoGithub } from "react-icons/io5";

export const Footer: React.FC = () => (
  <footer className="bg-black py-10">
    <div className="mx-auto max-w-6xl px-6">
      <ul className="flex justify-center gap-8">
        <li>
	  <a
	    href="https://github.com/Mccullahz/web-v2"
	    target="_blank"
	    rel="noopener noreferrer"
	    className="absolute left-10 text-sm font-poppins text-gray-400 hover:text-sky-500"
	    aria-label="Source Code"
	    >
	    © Powered by ZyGuy
	  </a>
          <a
            href="https://www.linkedin.com/in/zylar-mccullah-b4654420a/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl text-white transition-colors hover:text-sky-500"
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
            className="text-2xl text-white transition-colors hover:text-sky-500"
            aria-label="GitHub"
          >
            <IoLogoGithub />
          </a>
        </li>
      </ul>
    </div>
  </footer>
);
