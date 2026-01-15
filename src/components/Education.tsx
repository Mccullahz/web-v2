import React from "react";

export const Education: React.FC = () => (
  <section
    id="education"
    aria-label="education"
    className="relative bg-[#D2DBDD] py-24 min-h-screen"
  >
    <div className="mx-auto max-w-4xl px-6">
      <p className="mb-12 font-poppins text-sm font-semibold uppercase tracking-widest text-sky-500">
        Education
      </p>

      <div className="space-y-10">
        <div>
          <h2 className="font-poppins text-xl font-bold text-black">
            Indiana Tech, Fort Wayne, Indiana
          </h2>
          <p className="mt-1 font-poppins text-sm text-gray-700">
            B.S. Computer Science · 2020 – Present
          </p>
        </div>

        <div>
          <h2 className="font-poppins text-xl font-bold text-black">
            Goshen High School, Goshen, Ohio
          </h2>
          <p className="mt-1 font-poppins text-sm text-gray-700">
            High School Diploma · 2016 – 2020
          </p>
        </div>
      </div>
    </div>

    {/* svg divide -- broken, not currently doing anything */}
    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="h-24 w-full fill-white"
      >
        <path d="..." opacity=".25" />
        <path d="..." opacity=".5" />
        <path d="..." />
      </svg>
    </div>
  </section>
);

