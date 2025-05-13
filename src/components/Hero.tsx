import React from "react";

export const Hero: React.FC = () => (
  <section className="section headshot" id="home" aria-label="headshot">
    <div className="container">
      <figure style={{ '--width': 640, '--height': 840 } as React.CSSProperties}>
        <img src="/images/headshot.jpg" width={640} height={840} alt="Zylar McCullah" className="img-cover" />
      </figure>

      <div className="headshot-content">
        <p className="section-subtitle">Zylar McCullah</p>
        <h1 className="h1 headshot-title">Computer Science Student / Developer</h1>

        <ul className="headshot-list">
          <li>
            <a href="/port.html" className="list-link">
              <span className="span">Portfolio Page</span>
            </a>
          </li>
          <li>
            <a href="https://techcyberwarriors.org/" className="list-link">
              <span className="span">Collegiate Cyber Security Experience</span>
            </a>
          </li>
          <li>
            <a href="https://academics.indianatech.edu/programs/cs-bs/" className="list-link">
              <span className="span">Collegiate Programming Experience</span>
            </a>
          </li>
        </ul>

        <ul className="exp-list">
          <li className="list-item">
            <strong className="strong">Third Year</strong>
            <span className="span">Comp-Sci<br />Major</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
);

