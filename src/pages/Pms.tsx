import React from "react";

export const Pms: React.FC = () => (
    <section className="process-sim">
      <div className="sim-container">
        <h2>Operating System Process Management Simulator – CLI Edition</h2>
        <div className="pms-prev">
	<img
          src="/images/pms-prev.gif"
          alt="Process Management Simulator Demo"
          className="sim-gif"
        />
	</div>

        <p className="sim-lead">
          A terminal-based application that simulates how an operating system manages processes using only the command line.
			  <br />
	Built using Bubbletea and Lipgloss, providing a Linux based experience that's as (maybe more) stylish as it is functional.
        </p>

        <h2>Overview</h2>
        <p>This simulator demonstrates how an OS handles process scheduling through the:</p>
        <ul>
          <li>First Come First Served (FCFS)</li>
          <li>Round Robin (RR)</li>
	  <li>Task scheduling algorithms</li>
        </ul>
	<p>
	<br/>
          The simulator generates a set of <code>n</code> processes with randomized arrival and burst times,
          then simulates scheduling them in real time. 
	  <br />
	  It shows dynamic transitions between process states:
          <strong> Ready, Running, Waiting, Terminated</strong> — all color-coded in a stylish terminal layout.
	  <br />

	  For additional details or to view the source code, check out the <a href="https://www.github.com/Mccullahz/process-management-simulator">GitHub repository: Here</a>. Details on how to run the simulator are included in the README, please refer to it for instructions and download the proper version for your OS.
        </p>
      </div>
    </section>
  );
