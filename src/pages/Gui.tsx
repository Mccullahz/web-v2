import React from "react";

export const Gui: React.FC = () => (
  <>
    {/*need to whip up a gui page for the showcasing. ideally we can do this similar to HTML cards, and we could potentially flip the cards on hover to display more information. Front of card could display the GIF for the preview and then on hover we flip the card for displaying the info section from the terminal *info* command section*/}
    <div className="gui-container">
      <div className="gui-card" onClick={() => window.open("/Pms", "_self")}>
	<img
	  src="/images/pms-prev.gif"
	  alt="Process Management Simulator Demo"
	  className="sim-gif"
	/>
	<div className="card-info">
	  <h2>Process Management Simulator</h2>
	  <p>
	    A Go application that simulates how an operating system manages processes.
	    <br />
	  </p>
	</div>
	</div>

	<div className="gui-card" onClick={() => window.open("/Lms", "_self")}>
	<img
	  src="/images/lms-prev.gif"
	  alt="LMS Demo"
	  className="sim-gif"
	/>
	<div className="card-info">
	  <h2>Library Management System</h2>
	  <p>
	  A Java application built to showcase OOP principles and design patterns.
	    <br />
	    </p>
	    </div>
      </div>
      </div>
  </>
);

