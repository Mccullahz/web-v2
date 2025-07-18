import React from "react";
import { GuiCard } from "../components/GuiCard";

export const Gui: React.FC = () => {
  return (
    <div className="gui-container">
	
      <GuiCard
        title="Flacer"
        imageSrc="/images/flacer-prev.gif"
        altText="Flacer Demo"
        category="Cross-Platform High Resolution Audio Player"
        technologies="Using Go + Wails-React-TS"
        link="/Flacer"
      />

      <GuiCard
        title="Process Management Simulator"
        imageSrc="/images/pms-prev.gif"
        altText="Process Management Simulator Demo"
        category="Cross-Platform Application"
        technologies="Using Go + BubbleTea (CLI) / Go + Wails-React (GUI)"
        link="/Pms"
      />

      <GuiCard
        title="Library Management System"
        imageSrc="/images/lms-prev.gif"
        altText="Library Management System Demo"
        category="Windows Application"
        technologies="Using Java + FX / MySQL + Docker"
        link="/Lms"
      />

      <GuiCard
        title="Youtube Short Automation"
	imageSrc="/images/ysa-prev.gif"
	altText="Youtube Short Automation Demo"
	category="Linux Application"
	technologies="Using Python + PyQt5 / Youtube API + Davinci 3.5"
	link="/Ysa"
      />
    </div>
  );
};

