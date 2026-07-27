{/* Reusable project page component, shared by every /project route */}
import React from "react";
import { Link } from "react-router-dom";
import { IoArrowBackOutline, IoLogoGithub, IoArrowForwardOutline } from "react-icons/io5";
import { ScrollReveal } from "./ScrollReveal";

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
  <div className="landing-bg min-h-screen">
    <article className="mx-auto max-w-3xl px-6 pt-32 pb-24">
      <Link
        to="/gui"
        data-reveal
        className="inline-flex items-center gap-2 font-mono text-sm text-mut transition-colors hover:text-acc"
      >
        <IoArrowBackOutline /> back to portfolio
      </Link>

      <header data-reveal style={{ transitionDelay: "60ms" }} className="mt-8">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-acc">Project</span>
        <h1 className="mt-3 font-poppins text-4xl font-extrabold tracking-tight text-balance text-ink md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[60ch] font-poppins text-lg leading-relaxed text-mut">{lead}</p>
      </header>

      <figure
        data-reveal
        style={{ transitionDelay: "120ms" }}
        className="mt-10 overflow-hidden rounded-2xl border border-line bg-surf shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]"
      >
        <img src={gifSrc} alt={gifAlt} className="w-full" />
      </figure>

      <section data-reveal style={{ transitionDelay: "80ms" }} className="mt-12">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono text-sm text-acc">01</span>
          <h2 className="font-poppins text-2xl font-bold tracking-tight text-ink">Overview</h2>
          <span className="h-px flex-1 bg-line" />
        </div>

        <p className="font-poppins leading-relaxed text-mut">{overview}</p>

        <ul className="mt-6 space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex gap-3 font-poppins">
              <span className="mt-1 font-mono text-sm text-acc">→</span>
              <span className="text-mut">{feature}</span>
            </li>
          ))}
        </ul>

        <div
          className="mt-6 font-poppins leading-relaxed text-mut [&_a]:text-acc [&_a]:underline [&_a:hover]:text-acc2"
          dangerouslySetInnerHTML={{ __html: description }}
        />

        <a
          href={repoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-line bg-surf px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-acc hover:text-acc"
        >
          <IoLogoGithub className="text-base" /> View source on GitHub
          <IoArrowForwardOutline />
        </a>
      </section>
    </article>
    <ScrollReveal />
  </div>
);
