import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Ysa: React.FC = () => (
  <ProjectPage
    title="YouTube Short Automation"
    gifSrc="/images/ysa-prev.gif"
    gifAlt="YouTube Short Auto Demo"
    lead="A terminal-based Python application to automate the entire Youtube Shorts Workflow.</br>
Built using Python, PyQT, and OpenAI's Davinci models, providing a Linux based CLI environment."
    overview="This application demonstrates the ease of generating AI content, showcasing the (now obsolute) abilities of even early LLM's. Key features of this script are:"
    features={[
      "Python Scripting",
      "PyQT GUI",
      "OpenAI API",
    ]}
    description={`<br/>
      <br /><br />
      For additional details or to view the source code, check out the GitHub repository: Here. Details on how to run the script are included in the README, please refer to it for instructions on how to run the script.
    `}
    repoLink="https://www.github.com/Mccullahz/short-yt-auto"
  />
);


