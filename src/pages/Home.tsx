import React from "react";
import { Hero } from "../components/Hero";
import { Education } from "../components/Education";
import { Skills } from "../components/Skills";
import { Experience } from "../components/Experience";
import { Contact } from "../components/Contact";
import { ScrollReveal } from "../components/ScrollReveal";

export const Home: React.FC = () => (
  <div className="landing-bg">
    <div className="grain" aria-hidden="true" />
    <Hero />
    <Experience />
    <Skills />
    <Education />
    <Contact />
    <ScrollReveal />
  </div>
);
