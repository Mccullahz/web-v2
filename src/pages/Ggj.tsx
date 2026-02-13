import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Ggj: React.FC = () => (
  <ProjectPage
    title="Go Getta Job - A local CLI job board"
    gifSrc="/images/ggj-prev.gif"
    gifAlt="Go Getta Job Demo"
    lead="A command line application to help job seekers find local job opportunities by scraping nearby business websites for career pages. Built with Go, it provides a sleek terminal interface and leverages web scraping and geolocation to surface hidden job listings in small business websites."
    overview="This command line application features:"
    features={[
	    "- Sleek terminal interface using Bubbletea+ Lipgloss",
	    "- Scraping + Geo locational via ZIP built with Go Standard Libraries + Overpass API + Zippopotam.us"
    ]}
    description={`<br/>
	    This application finds nearby business websites and searches them for career or job listing pages. The goal is to automate localized job
	hunting by surfacing hiring pages often buried in small business websites. By searching only these local businesses, applicants can find job 
	opportunities that may not be listed on larger job boards, reducing resume traffic and potentially aiding in landing a desired position.
		<br />
    `}
    repoLink="https://www.github.com/Mccullahz/go-getta-job"
  />
);

