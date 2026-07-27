import React from "react";

const groups = [
  { label: "Languages", items: "Go · TypeScript · Python · C++ · Java · Bash" },
  { label: "Front-end", items: "React · HTML · CSS · JavaScript" },
  { label: "Systems", items: "Linux & Windows Server · PostgreSQL · MariaDB · MongoDB · Cisco" },
  { label: "Practices", items: "Docker · CI/CD · OOP" },
];

export const Skills: React.FC = () => (
  <section id="skills" aria-label="toolkit" className="px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="font-mono text-sm text-acc">02</span>
        <h2 className="font-poppins text-2xl font-bold tracking-tight text-ink">Toolkit</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
        {groups.map((group, i) => (
          <div key={group.label} data-reveal style={{ transitionDelay: `${i * 55}ms` }}>
            <h3 className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-faint">{group.label}</h3>
            <p className="font-poppins text-base leading-relaxed text-ink">{group.items}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
