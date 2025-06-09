import React from "react";

export const Experience: React.FC = () => (
  <section className="section workexp" id="workexp" aria-label="workexp">
    <div className="container">
      <p className="section-subtitle">Experience</p>
      <ul className="workexp-list">
        {[
          {
            period: "Contract",
            title: "Software Developer",
            address: "Firewatch Design Studio, Dayton, Ohio",
          },
          {
            period: "May, 2024 - August, 2024",
            title: "Debug Technician",
            address: "Jabil, Florence, Kentucky",
          },
          {
            period: "Sept, 2022 - Jan, 2024",
            title: "Helpdesk Engineer",
            address: "Forward Edge, Sharonville, Ohio",
          },
          {
            period: "Nov, 2021 - Nov, 2022",
            title: "Tech Assistant",
            address: "Indiana Tech, Fort Wayne, Indiana",
          },
          {
            period: "Aug, 2021 - Aug, 2023",
            title: "Offensive Security Specialist",
            address: "Cyber Warriors, Fort Wayne, Indiana",
          },
        ].map((job, i) => (
          <li className="workexp-item" key={i}>
            <h3 className="item-title">{job.title}</h3>
            <p className="item-address">{job.address}</p>
            <p className="item-period">{job.period}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

