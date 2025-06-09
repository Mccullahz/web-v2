import React from "react";
import { Hero } from "../components/Hero";
import { Education } from "../components/Education";
import { Skills } from "../components/Skills";
import { Experience } from "../components/Experience";
import { Contact } from "../components/Contact";

export const Home: React.FC = () => (
  <>
    <Hero />
    <Experience />
    <Skills />
    <Education />
    <Contact />
  </>
);

