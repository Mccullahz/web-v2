import React, { useState, useEffect, useRef } from "react";
import "../assets/styles/port.css";

export const Portfolio: React.FC = () => {
  const [history, setHistory] = useState<string[]>([
    "Thank You for Connecting to My Portfolio Terminal!",
    "Type `help` to get started.",
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const newHistory = [...history, `user@nqt$ ${trimmed}`];

    let response = "";

    switch (trimmed.toLowerCase()) {
      case "help":
        response = "Available commands:\n- ls\n- gui (launches user interface)\n- info <project>\n- run <project>\n- clear\n- help";
        break;
      case "ls":
        response = "-process-management-simulator -library-management-simulator -youtube-short-automation";
        break;
      case "ls -l":
	response = "drwxr-xr-x  3 user user 4096 Apr 25 2025 process-management-simulator\n" +
		  "drwxr-xr-x  5 user user 4096 Dec 12 2024 library-management-system\n" +
		  "drwxr-xr-x  2 viewer user 4096 Oct 1 2023 youtube-short-automation\n";
	break;
      case "run":
	response = "Please specify a project to run. Example: `run process-management-simulator`";
      	break;
      case "gui":
	response = "One moment while we prepare your graphical interface...";
        setTimeout(() => {
	  window.location.href = "/Gui";
	}, 1000);
	break
      case "info process-management-simulator":
	response = "Process Management Simulator: A Go CLI + Go Wails GUI tool for simulating process scheduling algorithms.";
      	break;
      case "info library-management-system":
	response = "Library Management Simulator: A Java + JFX + MySQL GUI tool for managing library operations.";
      	break;
      case "info youtube-short-automation":
	response = "YouTube Short Automation: A Python + Selenium CLI tool for automating YouTube short uploads.";
	break;
      case "run process-management-simulator":
        response = "Launching pms demo...";
        setTimeout(() => {
	  window.location.href = "/Pms";
	}, 1000);
        break;
      case "run library-management-simulator":
        response = "Opening library management simulator...";
        setTimeout(() => {
	  window.location.href = "/Lms";
	}, 1000);
        break;
      case "run youtube-short-automation":
	response = "Opening youtube short automation...";
        setTimeout(() => {
	  window.location.href = "/Ysa";
	}, 1000);
        break;
      case "clear":
        setHistory([]);
        setInput("");
        return;
      default:
        response = `Unknown command: '${trimmed}'\nType 'help' for a list of available commands.`;
    }

    setHistory([...newHistory, response]);
    setInput("");
  };

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
    <div className="terminal-header">
    <span className="terminal-header-title">NotQuiteATerminal</span>
        <div className="terminal-header-buttons">
	<div className="terminal-button-green"><ion-icon name="scan-circle-outline"/></div>
	<div className="terminal-button-yellow"><ion-icon name="remove-circle-outline"></ion-icon></div>
	<div className="terminal-button-red"><ion-icon name="close-circle-outline"></ion-icon></div>
	</div>
	      </div>
     <form className="terminal-input-line" onSubmit={handleCommand}>
        <span className="terminal-prompt">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="terminal-input"
          autoComplete="off"
        />
      </form>

      <div className="terminal-output">
        {history.map((line, idx) => (
          <pre key={idx} className="terminal-line">{line}</pre>
        ))}
      </div>
         </div>
  );
};

