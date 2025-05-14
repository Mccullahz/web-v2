import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <ul className="social-list">
          <li>
            <a
              href="https://www.linkedin.com/in/zylar-mccullah-b4654420a/"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
	      	    >
		<ion-icon name="logo-linkedin" aria-hidden="true"></ion-icon>
            </a>
          </li>
          <li>
            <a
              href="https://github.com/Mccullahz"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
	    	<ion-icon name="logo-github" aria-hidden="true"></ion-icon>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

