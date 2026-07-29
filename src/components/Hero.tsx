import { Link } from "react-router-dom";
import { IoArrowForwardOutline, IoLogoGithub, IoLogoLinkedin, IoMailOutline } from "react-icons/io5";
import { HeroPortrait } from "./HeroPortrait";

const quickLinks = [
  { label: "github", href: "https://github.com/Mccullahz", Icon: IoLogoGithub, external: true },
  { label: "linkedin", href: "https://www.linkedin.com/in/zylar-mccullah-b4654420a/", Icon: IoLogoLinkedin, external: true },
  { label: "email", href: "mailto:zylardmccullah@gmail.com", Icon: IoMailOutline, external: false },
];

export const Hero: React.FC = () => {
  // full viewport height with no bottom padding, so the portrait's lower edge
  // lands on the bottom of the screen and fades out into it
  return (
    <section
      id="home"
      aria-label="intro"
      className="px-6 pt-32 pb-16 md:flex md:min-h-screen md:items-end md:pt-40 md:pb-0"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* text column sizes to its own content, which makes its right edge
            viewport-independent — the portrait is then pulled back by the
            constant slack between that edge and the end of "stuff." */}
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,max-content)_1fr] md:items-end md:gap-x-0 md:gap-y-10">
          {/* content */}
          <div className="md:self-center">
            <h1
              data-reveal
              className="mt-5 mb-4 max-w-[15ch] font-poppins text-4xl font-extrabold leading-[1.02] tracking-tight text-balance text-ink md:text-6xl"
            >
              Hi, I'm Zylar and I like building <em className="not-italic text-acc">stuff</em>.
            </h1>

            <p
              data-reveal
              style={{ transitionDelay: "80ms" }}
              className="mb-7 max-w-[48ch] font-poppins text-lg leading-relaxed text-mut"
            >
              Integrations Engineer@iDonate,
              <b className="font-semibold text-ink"> Go &amp; Linux enthusiast</b>, Tool builder
            </p>

            <div data-reveal style={{ transitionDelay: "160ms" }} className="flex flex-wrap gap-3">
              <Link
                to="/gui"
                className="group inline-flex items-center gap-2 rounded-lg bg-linear-to-b from-acc2 to-acc px-5 py-3 font-mono text-sm font-bold text-onacc shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--color-acc)_60%,transparent)] transition-transform hover:-translate-y-0.5"
              >
                portfolio
                <IoArrowForwardOutline className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surf px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-acc"
              >
                contact
              </a>
            </div>

            {/* quick links */}
            <ul data-reveal style={{ transitionDelay: "220ms" }} className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              {quickLinks.map(({ label, href, Icon, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group inline-flex items-center gap-2 font-mono text-sm text-mut transition-colors hover:text-acc"
                  >
                    <Icon className="text-base" />
                    {label}
                    <span className="text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-acc">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* headshot */}
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
};
