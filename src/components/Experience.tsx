import React, { useId, useState } from "react";

interface Job {
  period: string;
  title: string;
  address: string;
  now?: boolean;
  href?: string;
  // shown when the card is expanded
  summary?: string;
  highlights?: string[];
  tools?: string[];
}

const jobs: Job[] = [
  {
    period: "2026 →",
    title: "integration engineer",
    address: "iDonate, remote",
    now: true,
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight", "TODO: another highlight"],
    tools: ["Typescript", "React", "Prismatic", "CRM"],
  },
  {
    period: "2024 – 25",
    title: "contract developer",
    address: "Firewatch Design Studio, Dayton, Ohio",
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight"],
    tools: ["Python", "Powershell" , "CV", "MediaPipe"],
  },
  {
    period: "2024",
    title: "debug technician",
    address: "Jabil Inc., Florence, Kentucky",
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight"],
    tools: ["Linux", "RHEL", "python"]
  },
  {
    period: "2022 – 24",
    title: "helpdesk engineer",
    address: "Forward Edge, Sharonville, Ohio",
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight"],
  },
  {
    period: "2021 – 22",
    title: "tech assistant",
    address: "Indiana Tech, Fort Wayne, Indiana",
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight"],
  },
  {
    period: "2021 – 23",
    title: "Offensive Security Specialist",
    address: "Cyber Warriors, Fort Wayne, Indiana",
    href: "https://techcyberwarriors.org/",
    summary: "TODO: one or two lines on what the role covers.",
    highlights: ["TODO: a highlight"],
  },
];

const NowBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-acc/40 bg-acc/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-acc">
    <span className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-acc opacity-70" />
      <span className="relative inline-flex size-1.5 rounded-full bg-acc" />
    </span>
    present
  </span>
);

const JobCard: React.FC<{ job: Job; index: number }> = ({ job, index }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li data-reveal style={{ transitionDelay: `${index * 55}ms` }} className="group relative py-1.5 pl-10">
      {/* diamond rail marker */}
      <span
        aria-hidden="true"
        className={`absolute left-3 top-7 z-10 size-2 -translate-x-1/2 rotate-45 border transition-colors duration-300 ${
          job.now || open ? "border-acc bg-acc" : "border-line bg-bg group-hover:border-acc"
        }`}
      />

      <article
        className={`relative overflow-hidden rounded-xl border transition-colors duration-300 ${
          open ? "border-acc/50 bg-surf/70" : job.now ? "border-acc/35 bg-surf/40" : "border-line bg-surf/40"
        } hover:border-acc/60 hover:bg-surf/70`}
      >
        {/* accent edge stands in for the old glow: a flat bar that grows in on hover/open */}
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-0.5 origin-top bg-acc transition-transform duration-300 ${
            open ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
          }`}
        />

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acc"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className={`font-mono text-xs tracking-tight ${job.now ? "text-acc" : "text-faint"}`}>
                {job.period}
              </span>
              {job.now && <NowBadge />}
            </div>

            <h3 className="mt-1.5 font-display text-base font-bold text-ink">{job.title}</h3>
            <p className="mt-0.5 font-body text-sm text-mut">{job.address}</p>
          </div>

          <span
            aria-hidden="true"
            className={`mt-1 grid size-6 flex-none place-items-center rounded border font-mono text-xs transition-colors duration-300 ${
              open ? "border-acc/60 text-acc" : "border-line text-faint group-hover:text-acc"
            }`}
          >
            <span className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
          </span>
        </button>

        {/* 0fr -> 1fr lets the panel ease to its natural height without measuring it */}
        <div
          id={panelId}
          role="region"
          aria-label={`${job.title} details`}
          inert={!open}
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div
              className={`mx-5 border-t border-line pt-3 pb-4 transition-opacity duration-300 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              {job.summary && <p className="font-body text-sm leading-relaxed text-mut">{job.summary}</p>}

              {job.highlights && job.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5 font-body text-sm text-ink">
                  {job.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span aria-hidden="true" className="font-mono text-acc">
                        &#8594;
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {(job.tools?.length || job.href) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {job.tools?.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-line bg-bg/60 px-1.5 py-0.5 font-mono text-[11px] text-mut"
                    >
                      {t.toLowerCase()}
                    </span>
                  ))}
                  {job.href && (
                    <a
                      href={job.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link ml-auto inline-flex items-center gap-1 font-mono text-xs text-mut transition-colors hover:text-acc"
                    >
                      visit
                      <span className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5">
                        ↗
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  );
};

export const Experience: React.FC = () => (
  <section id="workexp" aria-label="work experience" className="relative px-6 py-20">
    <div className="relative mx-auto max-w-5xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="rounded border border-line bg-surf/60 px-1.5 py-0.5 font-mono text-xs text-acc">01</span>
        <h2 className="bg-ink bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
          experience
        </h2>
        <span className="h-px flex-1 bg-linear-to-r from-line via-line to-transparent" />
      </div>

      <ul className="relative">
        {/* timeline rail behind the markers */}
        <span
          aria-hidden="true"
          className="absolute left-3 top-3 bottom-3 w-px bg-linear-to-b from-transparent via-line to-transparent"
        />

        {jobs.map((job, i) => (
          <JobCard key={job.title} job={job} index={i} />
        ))}
      </ul>
    </div>
  </section>
);
