import React from "react";
import { Link } from "react-router-dom";
import { IoArrowBackOutline, IoHomeOutline } from "react-icons/io5";

export const Fourohfour: React.FC = () => (
  <section
    className="min-h-[calc(100vh-theme(spacing.20))] bg-[#D2DBDD] pt-28 pb-16 px-6"
    aria-label="404 not found"
  >
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-6 flex justify-center gap-1 sm:gap-2">
        <span className="font-poppins text-7xl sm:text-8xl md:text-9xl font-extrabold text-black opacity-90 animate-pulse">
          4
        </span>
        <span
          className="font-poppins text-7xl sm:text-8xl md:text-9xl font-extrabold text-sky-500 animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          0
        </span>
        <span className="font-poppins text-7xl sm:text-8xl md:text-9xl font-extrabold text-black opacity-90 animate-pulse [animation-delay:150ms]">
          4
        </span>
      </div>

      <h1 className="font-poppins text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black mb-3 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.1s_forwards]">
        not found
      </h1>
      <p className="font-poppins text-gray-600 mb-10 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.25s_forwards]">
        The page you're looking for doesn't seem to exist. Please check the links below to navigate back to safety!
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.4s_forwards]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-poppins font-medium text-white transition-all duration-300 hover:bg-sky-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#D2DBDD]"
        >
          <IoHomeOutline className="text-xl" />
          Take me home
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-black px-6 py-3 font-poppins font-medium text-black transition-all duration-300 hover:border-sky-500 hover:text-sky-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#D2DBDD]"
        >
          <IoArrowBackOutline className="text-xl" />
          Run it back
        </button>
      </div>
    </div>
  </section>
);

export default Fourohfour;
