import React from "react";

export const Pms: React.FC = () => (
    <section className="process-sim">
      <div className="sim-container">
        <h1>Operating System Process Management Simulator – CLI Edition</h1>
        <img
          src="/images/pms.gif"
          alt="Process Management Simulator Demo"
          className="sim-gif"
        />

        <p className="sim-lead">
          A terminal-based application that simulates how an operating system manages processes
          using only the command line. Built using Bubbletea and Lipgloss, providing a Linux-like experience
          that's as stylish as it is functional.
        </p>

        <h2>Overview</h2>
        <p>This simulator demonstrates how an OS handles process scheduling through:</p>
        <ul>
          <li>First Come First Served (FCFS)</li>
          <li>Round Robin (RR)</li>
        </ul>
        <p>
          The simulator generates a set of <code>n</code> processes with randomized arrival and burst times,
          then simulates scheduling them in real time. It shows dynamic transitions between process states:
          <strong> Ready, Running, Waiting, Terminated</strong> — all color-coded in a stylish terminal layout.
        </p>

        <h2>Backend: Go</h2>
        <p>
          The backend is written in Go, and shares logic with the Wails GUI version through a common <code>cmd</code> package.
        </p>

        <pre>
{`type model struct {
  state         []cmd.ProcessStateSnapshot
  processes     []cmd.Process
  currentView   viewType
  selectedAlgo  algorithm
  numProcesses  int
  readyQueue    []cmd.Process
  running       *cmd.Process
  waitingQueue  []cmd.Process
  terminated    []cmd.Process
}`}
        </pre>

        <ul>
          <li><strong>Startup:</strong> Initializes UI, takes input for number of processes</li>
          <li><strong>Update:</strong> Handles selections, generation, and simulation logic</li>
          <li><strong>View:</strong> Displays queues with Lipgloss-styled boxes</li>
        </ul>

        <h2>Algorithms: FCFS & Round Robin</h2>
        <p>Shared logic in <code>cmd/algorithms.go</code> includes:</p>
        <ul>
          <li><strong>FCFS:</strong> Runs processes in arrival order, tracking timing and queue state</li>
          <li><strong>RR:</strong> Uses 2-tick time quantum, slices execution with state transitions</li>
          <li><strong>Snapshots:</strong> Every tick logs the full process state for animation</li>
        </ul>

        <h2>Installation & Usage</h2>
        <p><strong>Prerequisites:</strong> Go 1.20+, Linux/Unix terminal</p>

        <h3>Clone & Build:</h3>
        <pre>
{`git clone https://github.com/Mccullahz/Process-Management-Simulator/tree/linux/amd64
cd Process-Management-Simulator
go build
./Process-Management-Simulator`}
        </pre>

        <h3>Usage:</h3>
        <ul>
          <li>Select FCFS or RR</li>
          <li>Enter 5–20 processes</li>
          <li>Watch the simulation animate in real time</li>
          <li>Exit with <code>ctrl+c</code> or <code>q</code></li>
        </ul>

        <h2>Features</h2>
        <ul>
          <li>Interactive CLI using Bubbletea</li>
          <li>FCFS and RR with visual tick-based timelines</li>
          <li>Styled with Lipgloss</li>
          <li>Real-time CPU tick animation with queue updates</li>
          <li>Shared logic with GUI version</li>
        </ul>
      </div>
    </section>
  );
