import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Flacer: React.FC = () => (
  <ProjectPage
    title="Flacer"
    gifSrc="/images/flacer-prev.gif"
    gifAlt="Flacer Demo NOT FOUND"
    lead="Flacer is an in development cross-platform audio player that aims to provide a simple and intuitive interface to play high resolution audio files such as FLAC or WAC. It is built using the Go Wails framework, which allows for the creation of desktop applications with a web frontend."
    overview="This application features:"
    features={[
    
    "Cross-platform support (Windows, macOS, Linux, Web (if you're bold enough))",
    "High resolution audio playback up to 32-bit/384kHz",
    "Simple and intuitive user interface",
    "Support for lossless audio formats like FLAC and WAC",

    ]}
    description={`<br/>
      This project is currently in the early stages of development. The core functionality for playing audio files is implemented, the user interface is operational, playback is currently at a pause with the exception of WAV files.
	    <br /><br />
    `}
    repoLink="https://www.github.com/Mccullahz/flacer"
  />
);


