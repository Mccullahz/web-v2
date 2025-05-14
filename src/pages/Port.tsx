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

    const newHistory = [...history, `$ ${trimmed}`];

    let response = "";

    switch (trimmed.toLowerCase()) {
      case "help":
        response = "Available commands:\n - ls\n - run <project>\n - gui (launches user interface)\n - clear\n - help";
        break;
      case "ls":
        response = "-process-management-simulator -library-management-simulator -youtube-short-automation";
        break;
      case "ls -l":
	response = "drwxr-xr-x  3 user user 4096 Apr 25 2025 process-management-simulator\n" +
		  "drwxr-xr-x  5 user user 4096 Dec 12 2024 library-management-system\n" +
		  "drwxr-xr-x  2 viewer user 4096 Oct 1 2023 youtube-short-automation\n";
	break;
      case "run process-management-simulator":
        response = "Launching pms demo...";
        break;
      case "run library-management-simulator":
        response = "Opening library management simulator...";
        break;
      case "run youtube-short-automation":
	response = "Opening youtube short automation...";
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

