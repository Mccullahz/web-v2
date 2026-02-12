import React from "react";

export const Experience: React.FC = () => (
  <section
    id="workexp"
    aria-label="work experience"
    className="bg-[#D2DBDD] py-24 min-h-screen"
  >
    <div className="mx-auto max-w-4xl px-6">

      <p className="mb-12 font-poppins text-sm font-semibold uppercase tracking-widest text-sky-500">
        Experience
      </p>

      <ul className="space-y-10 border-l border-black/20 pl-8">
        {[
          {
            period: "Contract 2024-2025",
            title: "Contract Developer",
            address: "Firewatch Design Studio, Dayton, Ohio",
          },
          {
            period: "May, 2024 – August, 2024",
            title: "Debug Technician",
            address: "Jabil Inc., Florence, Kentucky",
          },
          {
            period: "Sept, 2022 – Jan, 2024",
            title: "Helpdesk Engineer",
            address: "Forward Edge, Sharonville, Ohio",
          },
          {
            period: "Nov, 2021 – Nov, 2022",
            title: "Tech Assistant",
            address: "Indiana Tech, Fort Wayne, Indiana",
          },
          {
            period: "Aug, 2021 – Aug, 2023",
            title: "Offensive Security Specialist",
            address: "Cyber Warriors, Fort Wayne, Indiana",
          },
        ].map((job, i) => (
          <li key={i} className="relative">

            {/* dot for timeline + abs left magic number */}
            <span className="absolute -left-[38.5px] top-1.5 h-3 w-3 rounded-full bg-sky-500" />

            <h3 className="font-poppins text-lg font-bold text-black hover:text-sky-500 hover:text-2xl hover:animate-bounce transition-all">
              {job.title}
            </h3>

            <p className="font-poppins text-sm text-gray-700 hover:text-gray-900 hover:text-lg transition-all">
              {job.address}
            </p>

            <p className="mt-1 font-poppins text-xs uppercase tracking-wide text-gray-500 hover:text-sm">
              {job.period}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
