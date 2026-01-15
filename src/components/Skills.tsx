import React from "react";

export const Skills: React.FC = () => (
  <section
    id="skills"
    aria-label="skills"
    className="relative bg-cover bg-center py-32 min-h-screen"
    style={{ backgroundImage: "url('/images/skills-bg.png')" }}
  >
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/40" />

    <div className="relative mx-auto max-w-6xl px-6">
      <div className="grid gap-20 md:grid-cols-2">

        {/* Content */}
        <div>
          <p className="mb-12 font-poppins text-sm font-semibold uppercase tracking-widest text-sky-400">
            Skills
          </p>

          <ul className="space-y-8">
            {[
              {
                label: "Front-End Development",
                items: "HTML / CSS / JavaScript / TypeScript / React",
              },
              {
                label: "Programming Languages",
                items: "C++ / Java / Go / Python / Bash",
              },
              {
                label: "Information Systems",
                items: "Windows Servers / Linux Servers / PostgreSQL / MariaDB / MongoDB / Cisco",
              },
              {
                label: "Misc. Items",
                items: "Docker / OOP / CI/CD Pipelines",
              },
            ].map((skill, i) => (
              <li key={i}>
                <h3 className="font-poppins text-sm font-semibold uppercase tracking-wide text-sky-300">
                  {skill.label}
                </h3>
                <p className="mt-2 font-poppins text-lg font-medium text-white">
                  {skill.items}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* divider */}
    <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="h-20 w-full fill-[#D2DBDD]"
      >
        <path d="..." />
      </svg>
    </div>
  </section>
);

