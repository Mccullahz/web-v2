import React, { useState } from "react";
import { Link } from "react-router-dom";

export const Header: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-[#D2DBDD]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-12 px-6 py-4">

        {/* logo */}
        <Link
          to="/"
          className="font-poppins text-3xl font-bold leading-none text-black"
        >
	McCullahz
        </Link>

        {/* actions */}
        <div className="relative">

          {/* hamburger why is this not populating at all? */}
	  <button
	  aria-label="Toggle navigation"
	  aria-expanded={navOpen}
	  onClick={() => setNavOpen((v) => !v)}
	  className="relative flex h-10 w-10 flex-col items-center justify-center gap-1 md:hidden"
	  >
	  <span
	  className={`block h-[2px] w-6 bg-black transition-transform duration-300 ${
		  navOpen ? "translate-y-[6px] rotate-45" : ""
	  }`}
	  />
	  <span
	  className={`block h-[2px] w-6 bg-black transition-opacity duration-300 ${
		  navOpen ? "opacity-0" : ""
	  }`}
	  />
	  <span
	  className={`block h-[2px] w-6 bg-black transition-transform duration-300 ${
		  navOpen ? "-translate-y-[6px] -rotate-45" : ""
	  }`}
	  />
	  </button>

          {/* nav */}
	  <nav
	  className={`
		  absolute right-0 top-full w-56 bg-[#D2DBDD]
		  transition-all duration-300 md:static md:w-auto md:bg-transparent
		  ${
			  navOpen
				  ? "max-h-96 opacity-100 pointer-events-auto"
				  : "max-h-0 opacity-0 pointer-events-none md:max-h-none md:opacity-100 md:pointer-events-auto"
		  }
		  `}
		  >

            <ul className="flex flex-col gap-6 px-6 py-6 md:flex-row md:gap-10 md:p-0">
              <li>
                <a
                  href="/#home"
                  onClick={() => setNavOpen(false)}
                  className="font-poppins font-medium text-black hover:text-sky-500"
                >
                  Home
                </a>
              </li>

              <li>
                <Link
                  to="/gui"
                  onClick={() => setNavOpen(false)}
                  className="font-poppins font-medium text-black hover:text-sky-500"
                >
                  Portfolio
                </Link>
              </li>

              <li>
                <a
                  href="/#workexp"
                  onClick={() => setNavOpen(false)}
                  className="font-poppins font-medium text-black hover:text-sky-500"
                >
                  Experience
                </a>
              </li>

              <li>
                <a
                  href="/#contact"
                  onClick={() => setNavOpen(false)}
                  className="font-poppins font-medium text-black hover:text-sky-500"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
