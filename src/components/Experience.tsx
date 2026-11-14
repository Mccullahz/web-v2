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
    summary: "development of component and code native crm + application integrations on the cloud based prismatic platform",
    highlights: ["salesforce npsp, virtuous, blackbaud"],
    tools: ["Typescript", "React", "Prismatic"],
  },
  {
    period: "2024 – 25",
    title: "contract developer",
    address: "Firewatch Design Studio, Dayton, Ohio",
    summary: "development of front and back-end components of a 3d python computer vision system focusing on real-time ux",
    highlights: [
      "automated internal windows tooling with batch + powershell, cutting deployment time by 40%",
      "computer vision, google-mediapipe, panda3D",
    ],
    tools: ["Python", "Powershell" , "Batch"],
  },
  {
    period: "2024",
    title: "debug technician",
    address: "Jabil Inc., Florence, Kentucky",
    summary: "debugging software and hardware related issues in linux based servers",
    highlights: [
      "70%+ debug accuracy across 4+ linux server models and 2+ distributions",
      "supplied thousands of log files to a linux data-validation pipeline",
    ],
    tools: ["Linux", "RHEL", "python"]
  },
  {
    period: "2022 – 24",
    title: "helpdesk engineer",
    address: "Forward Edge, Sharonville, Ohio",
    summary: "tier 1/2 support, managing 10,000+ devices and 7,000+ user accounts in a k–12 environment",
    highlights: ["built 5+ internal systems: ftp servers, internal dns, vpn servers and internal wikis"],
  },
  {
    period: "2021 – 23",
    title: "offensive security specialist",
    address: "Cyber Warriors, Fort Wayne, Indiana",
    summary: "competitive offensive security: national cyber league and ctf challenges across cryptography, traffic analysis and log parsing",
    highlights: [
      "top 11% nationally in the national cyber league (449th of 3,926)",
      "99th percentile web exploitation, 93rd osint, 92nd enumeration",
    ],
    href: "https://techcyberwarriors.org/",
  },
];

const NowBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-acc/40 bg-acc/10 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.14em] text-acc">
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
  // collapsed cards show only period / title / place; everything else waits behind the toggle
  const highlights = job.highlights ?? [];
  const hasDetails = Boolean(job.summary || highlights.length || job.tools?.length || job.href);

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
          open ? "border-acc/50 bg-surf/70" : job.now ? "border-acc/35 bg-surf/40" : "border-transparent"
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
          aria-expanded={hasDetails ? open : undefined}
          aria-controls={hasDetails ? panelId : undefined}
          disabled={!hasDetails}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-start disabled:cursor-default gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acc"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pr-10 sm:pr-0">
              <span className={`font-mono text-xs tracking-tight ${job.now ? "text-acc" : "text-faint"}`}>
                {job.period}
              </span>
              {job.now && <NowBadge />}
            </div>

            <h3 className="mt-1.5 pr-10 font-display text-base font-bold text-ink sm:pr-0">
              {job.title}
            </h3>
            <p className="mt-0.5 font-body text-sm text-mut">{job.address}</p>
          </div>

          {hasDetails && (
            <span
              aria-hidden="true"
              className={`absolute top-4 right-4 grid size-8 flex-none place-items-center rounded-md border font-mono text-sm transition-colors duration-300 sm:static sm:mt-0.5 ${
                open ? "border-acc/60 text-acc" : "border-line text-faint group-hover:text-acc"
              }`}
            >
              <span className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
            </span>
          )}
        </button>

        {/* 0fr -> 1fr lets the panel ease to its natural height without measuring it */}
        <div
          id={panelId}
          hidden={!hasDetails}
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
              {job.summary && (
                <p className="max-w-[68ch] font-prose text-base leading-relaxed text-ink/85">{job.summary}</p>
              )}

              {highlights.length > 0 && (
                <ul className="mt-3 max-w-[68ch] space-y-1.5 font-prose text-[0.9375rem] text-ink first:mt-0">
                  {highlights.map((h) => (
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
                <div className="mt-4 flex flex-wrap items-center gap-2 first:mt-0">
                  {job.tools?.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-line bg-bg/60 px-1.5 py-0.5 font-mono text-xs text-mut"
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
  <section id="workexp" aria-label="work experience" className="relative py-12">
    <div className="relative mx-auto max-w-6xl px-6">
      <div data-reveal="with-next" className="mb-10 flex items-baseline gap-3">
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
        <span
          aria-hidden="true"
          className="rail-fill absolute left-3 top-3 bottom-3 w-px bg-linear-to-b from-acc via-acc/60 to-transparent"
        />

        {jobs.map((job, i) => (
          <JobCard key={job.title} job={job} index={i} />
        ))}
      </ul>

      <div data-reveal className="mt-8 pl-10">
        <p className="mb-2 font-mono text-xs text-faint">// education</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-line bg-surf/40 px-5 py-4">
          <div>
            <h3 className="font-display text-base font-bold text-ink">b.s. computer science</h3>
            <p className="mt-0.5 font-body text-sm text-mut">Indiana Institute of Technology, Fort Wayne, Indiana</p>
          </div>
          <span className="font-mono text-xs text-faint">in progress</span>
        </div>
      </div>
    </div>
  </section>
);
