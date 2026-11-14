import { Link } from "react-router-dom";
import { IoArrowForwardOutline, IoDocumentTextOutline, IoLogoGithub, IoLogoLinkedin, IoMailOutline } from "react-icons/io5";
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
      className="pt-28 pb-16 md:flex md:min-h-[min(100vh,860px)] md:items-center md:pt-24 md:pb-10"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* text column sizes to its own content, which makes its right edge
            viewport-independent — the portrait is then pulled back by the
            constant slack between that edge and the end of "stuff." */}
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end md:gap-x-6 md:gap-y-10 lg:grid-cols-[minmax(0,max-content)_1fr] lg:gap-x-8">
          {/* content */}
          <div className="md:self-center">
            <p data-reveal className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-acc">
              software developer · backend, integrations &amp; security
            </p>
            <h1
              data-reveal
              className="mt-3 mb-4 max-w-[15ch] font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-balance text-ink md:text-5xl lg:text-6xl"
            >
              hi, i'm zylar and i like building <em className="not-italic text-acc">stuff</em>.
            </h1>

            <p
              data-reveal
              style={{ transitionDelay: "80ms" }}
              className="mb-7 max-w-[36ch] font-prose text-xl leading-relaxed text-mut"
            >
              integration engineer @ iDonate, connecting nonprofit crms on prismatic. i build backend
              tools &amp; automation in <b className="font-semibold text-ink">go, typescript &amp; python</b>.
            </p>

            <div data-reveal style={{ transitionDelay: "160ms" }} className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
              <a
                href="/zylar-mccullah-resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-b from-acc2 to-acc px-5 py-3 font-mono text-sm font-bold text-onacc shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--color-acc)_60%,transparent)] transition-transform hover:-translate-y-0.5"
              >
                résumé
                <IoDocumentTextOutline className="transition-transform duration-300 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/gui"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surf px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-acc"
              >
                portfolio
                <IoArrowForwardOutline className="text-acc transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surf px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-acc"
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
