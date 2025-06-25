{/* Reusable project page component, reducing code reuse in proj pages */}
import React from "react";

type ProjectPageProps = {
  title: string;
  gifSrc: string;
  gifAlt: string;
  lead: string;
  overview: string;
  features: string[];
  description: string;
  repoLink: string;
};

export const ProjectPage: React.FC<ProjectPageProps> = ({
  title,
  gifSrc,
  gifAlt,
  lead,
  overview,
  features,
  description,
  repoLink,
}) => (
  <section className="process-sim">
    <div className="sim-container">
      <h2>{title}</h2>
      <div className="pms-prev">
        <img src={gifSrc} alt={gifAlt} className="sim-gif" />
      </div>

      <p className="sim-lead">{lead}</p>

      <h2>Overview</h2>
      <p>{overview}</p>
      <ul>
        {features.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>
      <p dangerouslySetInnerHTML={{ __html: description }} />
      <p>
        For additional details or to view the source code, check out the{" "}
        <a href={repoLink} target="_blank" rel="noopener noreferrer">
          GitHub repository: Here
        </a>
        .
      </p>
    </div>
  </section>
);

