import { Link } from "react-router-dom";
import { IoArrowForwardOutline, IoArrowDown } from "react-icons/io5";

export const Hero: React.FC = () => (
  <section className="section headshot" id="home" aria-label="headshot">
    <div className="container">
      <div className="headshot-container">
        <figure className="headshot-banner">
          <img
            src="/images/headshot.jpg"
            alt="Zylar McCullah"
            className="img-cover"
          />
        </figure>

        <div className="headshot-content">
          <p className="section-subtitle">Zylar McCullah</p>
          <h1 className="headshot-title">Student / Developer</h1>

          <ul className="headshot-list">
            <li>
              <Link to="/portfolio" className="list-link">
                <span className="span">Portfolio Page</span>
                <IoArrowForwardOutline aria-hidden="true" />
              </Link>
            </li>
            <li>
              <a
                href="https://techcyberwarriors.org/"
                className="list-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="span">Collegiate Cyber Security Experience</span>
                <IoArrowForwardOutline aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://academics.indianatech.edu/programs/cs-bs/"
                className="list-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="span">Collegiate Programming Experience</span>
                <IoArrowForwardOutline aria-hidden="true" />
              </a>
            </li>
          </ul>

          <ul className="exp-list">
            <li className="list-item">
              <strong className="strong">Third Year</strong>
              <span className="span">Comp-Sci Major</span>
            </li>
          </ul>

          <a href="#experience" className="slide-down-btn" aria-label="scroll-down">
            <IoArrowDown aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  </section>
);

