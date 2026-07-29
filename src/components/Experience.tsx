import React from "react";

interface Job {
  period: string;
  title: string;
  address: string;
  now?: boolean;
  href?: string;
}

const jobs: Job[] = [
  { period: "2026 →", title: "Integration Engineer", address: "iDonate, Remote", now: true },
  { period: "2024 – 25", title: "Contract Developer", address: "Firewatch Design Studio, Dayton, Ohio" },
  { period: "2024", title: "Debug Technician", address: "Jabil Inc., Florence, Kentucky" },
  { period: "2022 – 24", title: "Helpdesk Engineer", address: "Forward Edge, Sharonville, Ohio" },
  { period: "2021 – 22", title: "Tech Assistant", address: "Indiana Tech, Fort Wayne, Indiana" },
  {
    period: "2021 – 23",
    title: "Offensive Security Specialist",
    address: "Cyber Warriors, Fort Wayne, Indiana",
    href: "https://techcyberwarriors.org/",
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

export const Experience: React.FC = () => (
  <section id="workexp" aria-label="work experience" className="relative px-6 py-20">
    {/* bloom so the section sits on a pool of light */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-8 -z-0 mx-auto h-64 max-w-4xl blur-2xl"
      style={{ background: "radial-gradient(60% 60% at 20% 0%, var(--color-glow), transparent 70%)" }}
    />

    <div className="relative mx-auto max-w-4xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="rounded border border-line bg-surf/60 px-1.5 py-0.5 font-mono text-xs text-acc">01</span>
        <h2 className="bg-linear-to-r from-ink via-acc to-acc2 bg-clip-text font-poppins text-2xl font-bold tracking-tight text-transparent">
          Experience
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
          <li
            key={i}
            data-reveal
            style={{ transitionDelay: `${i * 55}ms` }}
            className="group relative py-1.5 pl-10"
          >
            {/* diamond rail marker */}
            <span
              aria-hidden="true"
              className={`absolute left-3 top-7 z-10 size-2 -translate-x-1/2 rotate-45 border transition-colors duration-300 ${
                job.now
                  ? "border-acc bg-acc shadow-[0_0_12px_color-mix(in_oklab,var(--color-acc)_70%,transparent)]"
                  : "border-line bg-bg group-hover:border-acc"
              }`}
            />

            <article
              className={`relative overflow-hidden rounded-xl border bg-surf/40 px-5 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-acc/60 hover:bg-surf/70 hover:shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--color-acc)_55%,transparent)] ${
                job.now ? "border-acc/35" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span
                  className={`font-mono text-xs tracking-tight ${job.now ? "text-acc" : "text-faint"}`}
                >
                  {job.period}
                </span>
                {job.now && <NowBadge />}
              </div>

              <h3 className="mt-1.5 font-poppins text-base font-bold text-ink">
                {job.href ? (
                  <a
                    href={job.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-acc"
                  >
                    {job.title}
                    <span className="font-mono text-xs text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-acc">
                      ↗
                    </span>
                  </a>
                ) : (
                  job.title
                )}
              </h3>

              <p className="mt-0.5 font-poppins text-sm text-mut">{job.address}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
