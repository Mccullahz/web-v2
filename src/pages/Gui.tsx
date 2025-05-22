import React from "react";

export const Gui: React.FC = () => (
  <>
    {/*need to whip up a gui page for the showcasing. ideally we can do this similar to HTML cards, and we could potentially flip the cards on hover to display more information. Front of card could display the GIF for the preview and then on hover we flip the card for displaying the info section from the terminal *info* command section*/}
    <div className="gui-container">
    <div className="gui-card">
  <div className="gui-card-inner">
    <div className="gui-card-front">
      <h2>Process Management Simulator</h2>
      <img
        src="/images/pms-prev.gif"
        alt="Process Management Simulator Demo"
        className="sim-gif"
      />
    </div>
    <div className="gui-card-back" onClick={() => window.open("/Pms", "_self")}>
      <strong>
        A Go CLI + Go Wails GUI tool for simulating how an operating system manages process via scheduling algorithms
      </strong>
      <br />
      <p>
	<strong>Click for more information!</strong>
      </p>
    </div>
  </div>
</div>

      </div>
  </>
);

