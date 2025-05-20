import React from "react";

export const Skills: React.FC = () => (
  <section
    className="section-skills has-before"
    id="skills"
    aria-label="skills"
    style={{ backgroundImage: "url('../images/skills-bg.png')" }}
  >
    <div className="container">
      <div className="skills-content">
        <p className="section-subtitle">Skills</p>

        <ul className="skills-list">
          <li className="skills-item">
            <div className="wrapper">
              <h3 className="discipline">Front-End Development:</h3>
              <h2 className="items">HTML / CSS / JavaScript / React / NextJS / NPM</h2>
            </div>
          </li>
          <li className="skills-item">
            <div className="wrapper">
              <h3 className="discipline">Programming Languages:</h3>
              <h2 className="items">C++ / Java / Go / Python / Ansible / Bash / Powershell / Zsh</h2>
            </div>
          </li>
          <li className="skills-item">
            <div className="wrapper">
              <h3 className="discipline">Information Systems:</h3>
              <h2 className="items">Windows Servers / Linux Servers / MySQL / MariaDB / Cisco / Extreme</h2>
            </div>
          </li>
          <li className="skills-item">
            <div className="wrapper">
              <h3 className="discipline">Operating Systems:</h3>
              <h2 className="items">Windows 10/11 / MacOS / Ubuntu, RHEL, Arch</h2>
            </div>
          </li>
          <li className="skills-item">
            <div className="wrapper">
              <h3 className="discipline">Misc. Items:</h3>
              <br />
              <h2 className="items">
                Containerization (Docker) / OOP / CI/CD Pipelines
              </h2>
            </div>
          </li>
        </ul>
      </div>

      <div className="skills-banner has-before"></div>
    </div>

    <div className="custom-shape-divider-top-1704684987">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path className="shape-fill" d="..." />
      </svg>
    </div>
  </section>
);

