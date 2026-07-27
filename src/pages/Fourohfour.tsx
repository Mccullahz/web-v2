import React from "react";
import { Link } from "react-router-dom";
import { IoArrowBackOutline, IoHomeOutline } from "react-icons/io5";

export const Fourohfour: React.FC = () => (
  <div className="landing-bg">
    <section className="min-h-[calc(100vh-theme(spacing.20))] px-6 pt-32 pb-16" aria-label="404 not found">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center gap-1 sm:gap-2">
          <span className="font-poppins text-7xl font-extrabold text-ink opacity-90 animate-pulse sm:text-8xl md:text-9xl">
            4
          </span>
          <span
            className="font-poppins text-7xl font-extrabold text-acc animate-bounce sm:text-8xl md:text-9xl"
            style={{ animationDuration: "2s" }}
          >
            0
          </span>
          <span className="font-poppins text-7xl font-extrabold text-ink opacity-90 animate-pulse [animation-delay:150ms] sm:text-8xl md:text-9xl">
            4
          </span>
        </div>

        <h1 className="mb-3 font-poppins text-2xl font-bold uppercase tracking-tight text-ink opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.1s_forwards] sm:text-3xl">
          not found
        </h1>
        <p className="mb-10 font-poppins text-mut opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.25s_forwards]">
          The page you're looking for doesn't seem to exist. Please check the links below to navigate back to safety!
        </p>

        <div className="flex flex-col items-center justify-center gap-4 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_0.4s_forwards] sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-b from-acc2 to-acc px-6 py-3 font-mono font-bold text-onacc transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            <IoHomeOutline className="text-xl" />
            Take me home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surf px-6 py-3 font-mono text-ink transition-colors duration-300 hover:border-acc hover:text-acc focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            <IoArrowBackOutline className="text-xl" />
            Run it back
          </button>
        </div>
      </div>
    </section>
  </div>
);

export default Fourohfour;
