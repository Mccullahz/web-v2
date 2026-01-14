import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/style.css";

export const Header: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  const toggleNavbar = () => {
    setNavOpen(!navOpen);
  };

  return (
    <header className="header" data-header>
      <div className="container header-container">
        <a href="/" className="logo">McCullah</a>

        <div className="header-actions">
          <button
            className={`nav-toggle-btn ${navOpen ? "active" : ""}`}
            aria-label="toggle menu"
            onClick={toggleNavbar}
          >
            <span className="line line-1"></span>
            <span className="line line-2"></span>
            <span className="line line-3"></span>
          </button>

          <nav className={`navbar ${navOpen ? "active" : ""}`} data-navbar>
            <ul className="navbar-list">
              <li><a href="/#home" className="navbar-link" onClick={() => setNavOpen(false)}>Home</a></li>
	      <li><Link to="/gui" className="navbar-link" onClick={() => setNavOpen(false)}>Portfolio</Link></li>
              <li><a href="/#workexp" className="navbar-link" onClick={() => setNavOpen(false)}>Experience</a></li>
              <li><a href="/#contact" className="navbar-link" onClick={() => setNavOpen(false)}>Contact</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

