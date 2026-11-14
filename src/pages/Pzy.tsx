import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Pzy: React.FC = () => (
  <ProjectPage
    title="PZY Coffee Suite"
    gifSrc="/images/ysa-prev.gif"
    gifAlt="PZY Suite Demo"
    lead="A full-stack e-commerce web application.
    Built using Go, Typescript, React, and Postgres, providing an interesting approach to what a modern coffee website could be."
    overview="This application has been my main side project, demonstrating and testing my abilities to create not only a solid, secure backend, but also a modern - interesting frontend. Admittedly, I have always found UI/UX design to be my weakest link, but in creating this project, I believe that I have expanded my design horizon, honing my own person design language significantly."
    features={[
    ]}
    description={`<br/>
      <br /><br />
      For additional details or to view the source code, check out the GitHub repository: Here.
    `}
    repoLink="https://www.github.com/Mccullahz/coffeeco"
  />
);


