import React from "react";

export const Education: React.FC = () => (
  <section className="section education" id="education" aria-label="education">
    <div className="container">
      <p className="section-subtitle">Education</p>

      <h2 className="loc">Indiana Tech, Fort Wayne, Indiana.</h2>
      <p className="deg">B.S Computer Science, 2020 - Present</p>

      <h2 className="loc">Goshen High School, Goshen, Ohio.</h2>
      <p className="deg">High School Diploma, 2016 - 2020</p>
    </div>

    <div className="custom-shape-divider-bottom-1704684840">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="..." opacity=".25" className="shape-fill"></path>
        <path d="..." opacity=".5" className="shape-fill"></path>
        <path d="..." className="shape-fill"></path>
      </svg>
    </div>
  </section>
);

