import React from "react";
import type { IconType } from "react-icons";
import { FaJava } from "react-icons/fa";
import {
  SiCisco,
  SiCplusplus,
  SiCss3,
  SiDocker,
  SiGnubash,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiLinux,
  SiMariadb,
  SiMongodb,
  SiPostgresql,
  SiPython,
  SiReact,
  SiTypescript,
} from "react-icons/si";

// stylized "Z" drawn in the same graded character palette the arch fastfetch
// art used: light ` . : / + o edges around a dense z-fill core
const ART = [
  "    `.:/+ooozzzzzzzzzzzzzzooo+/:.`    ",
  "    /+oozzzzzzzzzzzzzzzzzzzzzzoo+/    ",
  "    +ozzzzzzzzzzzzzzzzzzzzzzzzzzo+    ",
  "    oozzzzzzzzzzzzzzzzzzzzzzzzzzoo    ",
  "                        /ozzzzzo/     ",
  "                      +ozozzzo+       ",
  "                    :+zzzzz+:         ",
  "                  /oozzzoo/           ",
  "                +ozzzzzo+             ",
  "              /:zzozz:/               ",
  "            o+zzzzz+o                 ",
  "          /ozzzozo/                   ",
  "        +ozzzzzo+                     ",
  "      :+ozzzz+:                       ",
  "    /ozzzzzo/                         ",
  "    oozzzzzzzzzzzzzzzzzzzzzzzzzzoo    ",
  "    +ozzzzzzzzzzzzzzzzzzzzzzzzzzo+    ",
  "    /+oozzzzzzzzzzzzzzzzzzzzzzoo+/    ",
  "    `.:/+ooozzzzzzzzzzzzzzooo+/:.`    "
].join("\n");

const FACTS: [string, string][] = [
  ["UPTIME", "5 years, still building"],
  ["THEME", "Aperture / Warm"],
];

interface Tool {
  label: string;
  Icon?: IconType;
}

const GROUPS: { label: string; tone: string; tools: Tool[] }[] = [
  {
    label: "LANGUAGES",
    tone: "var(--stack-c1)",
    tools: [
      { label: "Go", Icon: SiGo },
      { label: "TypeScript", Icon: SiTypescript },
      { label: "Python", Icon: SiPython },
      { label: "C++", Icon: SiCplusplus },
      { label: "Java", Icon: FaJava },
      { label: "Bash", Icon: SiGnubash },
    ],
  },
  {
    label: "FRONT-END",
    tone: "var(--stack-c2)",
    tools: [
      { label: "React", Icon: SiReact },
      { label: "HTML", Icon: SiHtml5 },
      { label: "CSS", Icon: SiCss3 },
      { label: "JavaScript", Icon: SiJavascript },
    ],
  },
  {
    label: "SYSTEMS",
    tone: "var(--stack-c3)",
    tools: [
      { label: "Linux", Icon: SiLinux },
      { label: "Windows Server" },
      { label: "PostgreSQL", Icon: SiPostgresql },
      { label: "MariaDB", Icon: SiMariadb },
      { label: "MongoDB", Icon: SiMongodb },
      { label: "Cisco", Icon: SiCisco },
    ],
  },
  {
    label: "PRACTICES",
    tone: "var(--stack-c4)",
    tools: [{ label: "Docker", Icon: SiDocker }, { label: "CI/CD" }, { label: "OOP" }],
  },
];

// Palette chips: neutrals darkest -> lightest, then the accent family
// darkest -> lightest. Ordered by luminance in the (primary) dark theme.
const SWATCHES = [
  // neutrals
  "var(--color-bg)",
  "var(--color-surf)",
  "var(--color-surf2)",
  "var(--color-line)",
  "var(--color-faint)",
  "var(--color-mut)",
  "var(--color-ink)",
  // accent family
  "color-mix(in oklab, var(--color-acc) 22%, var(--color-bg))",
  "color-mix(in oklab, var(--color-acc) 45%, var(--color-bg))",
  "color-mix(in oklab, var(--color-acc) 68%, var(--color-bg))",
  "var(--stack-c4)",
  "color-mix(in oklab, var(--color-acc) 88%, var(--color-bg))",
  "var(--stack-c3)",
  "var(--color-acc)",
  "var(--color-acc2)",
];

const Segment: React.FC<{ bg: string; fg: string; className?: string; children: React.ReactNode }> = ({
  bg,
  fg,
  className = "",
  children,
}) => (
  <span
    style={{ "--seg-bg": bg, "--seg-fg": fg } as React.CSSProperties}
    className={`ff-seg flex items-center whitespace-nowrap py-1 pr-3.5 pl-3 ${className}`}
  >
    {children}
  </span>
);

export const Skills: React.FC = () => (
  <section id="skills" aria-label="toolkit" className="relative px-6 py-20">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-8 -z-0 mx-auto h-64 max-w-5xl blur-2xl"
      style={{ background: "radial-gradient(60% 60% at 80% 0%, var(--color-glow), transparent 70%)" }}
    />

    <div className="relative mx-auto max-w-5xl">
      <div data-reveal className="mb-8 flex items-baseline gap-3">
        <span className="rounded border border-line bg-surf/60 px-1.5 py-0.5 font-mono text-xs text-acc">02</span>
        <h2 className="bg-ink bg-clip-text font-poppins text-2xl font-bold tracking-tight text-transparent">
          Stack
        </h2>
        <span className="h-px flex-1 bg-linear-to-r from-line via-line to-transparent" />
      </div>

      <div
        data-reveal
        className="overflow-hidden rounded-md border border-none font-mono text-[0.78rem] leading-relaxed"
        style={{ background: "clear" }}
      >
        {/* status bar */}
        <div className="flex items-stretch text-[0.72rem]">
          <span className="flex-1" />
        </div>
        <div className="flex items-stretch border-none text-[0.72rem]">
          <Segment bg="var(--color-acc2)" fg="var(--color-bg)" className="font-bold">
            visitor@zylarmccullah.tech
          </Segment>
          <Segment bg="clear" fg="var(--text-faint)" className="pl-4.5 font-bold">
           &gt; fastfetch
          </Segment>
          <span className="flex-1" />
        </div>

        {/* art + info */}
        <div className="grid gap-0 p-4 lg:grid-cols-[auto_1fr] lg:gap-x-8 lg:p-5">
          <pre
            aria-hidden="true"
            className="m-0 hidden select-none leading-[1.05] text-acc lg:block"
            style={{ fontSize: "clamp(0.52rem, 1.6vw, 1.2rem)" }}
          >
            {ART}
          </pre>

          <div className="min-w-0">

            <dl className="mt-1 grid grid-cols-1 items-baseline gap-x-2 sm:grid-cols-[6rem_auto_1fr]">
              {FACTS.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="mt-1.5 font-bold text-acc2 sm:mt-0">{k}</dt>
                  <span aria-hidden="true" className="hidden text-faint sm:inline">
                    &#8594;
                  </span>
                  <dd className="m-0 min-w-0 break-words text-ink">{v}</dd>
                </React.Fragment>
              ))}
            </dl>

            {/* modules flow into two columns so they stand level with the art */}
            <div className="mt-3 columns-1 gap-x-8 lg:columns-2">
              {GROUPS.map((group) => (
                <div
                  key={group.label}
                  style={{ "--c": group.tone } as React.CSSProperties}
                  className="mb-3 break-inside-avoid"
                >
                  <div
                    className="flex items-center gap-2 whitespace-nowrap font-bold tracking-[0.06em]"
                    style={{ color: "var(--c)" }}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-[2px] border-2"
                      style={{ borderColor: "var(--c)" }}
                    />
                    {group.label}
                    <span aria-hidden="true" className="font-normal tracking-normal text-faint">
                      &#8594;
                    </span>
                    <span className="font-normal tracking-normal text-faint">
                      {group.tools.length} tracked
                    </span>
                  </div>

                  <ul
                    className="ml-1 border-l-2 py-0.5"
                    style={{ borderColor: "var(--c)" }}
                  >
                    {group.tools.map((tool) => {
                      const Icon = tool.Icon;
                      return (
                        <li key={tool.label} className="ff-row flex items-center gap-2 py-px pl-2">
                          <span
                            {...(Icon ? { role: "img", "aria-label": tool.label, tabIndex: 0 } : { "aria-hidden": true })}
                            className={`relative grid size-6 flex-none place-items-center rounded-[0.28rem] border text-ink ${
                              Icon ? "" : "border-dashed text-faint"
                            }`}
                            style={{
                              borderColor: "color-mix(in oklab, var(--c) 45%, transparent)",
                              background: "color-mix(in oklab, var(--c) 10%, transparent)",
                            }}
                          >
                            {Icon ? (
                              <>
                                <Icon aria-hidden="true" className="size-3.5" />
                                {/* channel copies that tear on hover */}
                                <span
                                  aria-hidden="true"
                                  className="mark-a pointer-events-none absolute inset-0 grid place-items-center text-acc opacity-0"
                                >
                                  <Icon className="size-3.5" />
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="mark-b pointer-events-none absolute inset-0 grid place-items-center text-acc2 opacity-0"
                                >
                                  <Icon className="size-3.5" />
                                </span>
                              </>
                            ) : (
                              <span className="text-[0.6rem]">&#8212;</span>
                            )}
                          </span>
                          <span aria-hidden="true" className="flex-none text-faint">
                            &#8594;
                          </span>
                          <span className="text-ink">{tool.label.toLowerCase()}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div aria-hidden="true" className="mt-4 flex flex-wrap gap-1.5">
              {SWATCHES.map((c, i) => (
                <span
                  key={i}
                  className="block size-3 rounded-full border"
                  style={{ background: c, borderColor: "color-mix(in oklab, var(--color-ink) 22%, transparent)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
