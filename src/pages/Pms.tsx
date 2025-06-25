import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Pms: React.FC = () => (
  <ProjectPage
    title="Operating System Process Management Simulator – CLI Edition"
    gifSrc="/images/pms-prev.gif"
    gifAlt="Process Management Simulator Demo"
    lead="A terminal-based application that simulates how an operating system manages processes using only the command line. Built using Bubbletea and Lipgloss, providing a Linux based experience that's as (maybe more) stylish as it is functional."
    overview="This simulator demonstrates how an OS handles process scheduling through the:"
    features={[
      "First Come First Served (FCFS)",
      "Round Robin (RR)",
      "Task scheduling algorithms",
    ]}
    description={`<br/>
      The simulator generates a set of <code>n</code> processes with randomized arrival and burst times,
      then simulates scheduling them in real time. <br />
      It shows dynamic transitions between process states:
      <strong> Ready, Running, Waiting, Terminated</strong> — all color-coded in a stylish terminal layout.
      <br /><br />
      For additional details or to view the source code, check out the repository below. Details on how to run the simulator are included in the README, please refer to it for instructions and download the proper version for your OS.
    `}
    repoLink="https://www.github.com/Mccullahz/process-management-simulator"
  />
);

