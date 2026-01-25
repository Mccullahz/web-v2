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
  <section className="relative bg-[#D2DBDD] py-24 min-h-screen">
    <div className="mx-auto max-w-4xl px-6">
      <h2 className="font-poppins text-2xl font-bold text-sky-500 mb-3">
      {title}
      </h2>

      <div className="overflow-hidden rounded-xl max-w-[800px] max-h-[800px]">
        <img src={gifSrc} alt={gifAlt} className="sim-gif" />
      </div>

      <p className="mb-8 font-poppins text-l font-bold leading-tight text-black">{lead}</p>

      <h2 className="mb-2 font-poppins text-sm font-semibold uppercase tracking-widest text-sky-500">Overview</h2>
      <div className="my-6 font-poppins text-slate-900">
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
    </div>
  </section>
);

