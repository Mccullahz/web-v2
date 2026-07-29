import React from "react";

const schools = [
  { name: "Indiana Tech, Fort Wayne, Indiana", detail: "B.S. Computer Science · 2020 – Present" },
  { name: "Goshen High School, Goshen, Ohio", detail: "High School Diploma · 2016 – 2020" },
];

export const Education: React.FC = () => (
  <section id="education" aria-label="education" className="px-6 py-20">
    <div className="mx-auto max-w-5xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="font-mono text-sm text-acc">03</span>
        <h2 className="font-poppins text-2xl font-bold tracking-tight text-ink">Education</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-6">
        {schools.map((school, i) => (
          <div
            key={school.name}
            data-reveal
            style={{ transitionDelay: `${i * 55}ms` }}
            className="border-t border-line pt-6 first:border-t-0 first:pt-0"
          >
            <h3 className="font-poppins text-lg font-bold text-ink">{school.name}</h3>
            <p className="mt-1 font-poppins text-sm text-mut">{school.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
