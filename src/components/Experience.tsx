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

export const Experience: React.FC = () => (
  <section id="workexp" aria-label="work experience" className="px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="font-mono text-sm text-acc">01</span>
        <h2 className="font-poppins text-2xl font-bold tracking-tight text-ink">Experience</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      <ul>
        {jobs.map((job, i) => (
          <li
            key={i}
            data-reveal
            style={{ transitionDelay: `${i * 55}ms` }}
            className="grid grid-cols-[80px_1fr] gap-4 border-t border-line py-4 first:border-t-0 sm:grid-cols-[110px_1fr]"
          >
            <span className={`pt-0.5 font-mono text-xs ${job.now ? "text-acc" : "text-faint"}`}>{job.period}</span>
            <div>
              <h3 className="font-poppins text-base font-bold text-ink">
                {job.href ? (
                  <a href={job.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-acc">
                    {job.title}
                    <span className="ml-1 font-mono text-xs text-faint">↗</span>
                  </a>
                ) : (
                  job.title
                )}
              </h3>
              <p className="mt-0.5 font-poppins text-sm text-mut">{job.address}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
