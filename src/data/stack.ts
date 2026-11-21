// The stack, as the "fastfetch" in the skills section prints it. Shared with the café's POS
// terminal (`neofetch`), so the two always agree. Icons are attached in Skills.tsx.

// stylized "Z" drawn in the same graded character palette the arch fastfetch
// art used: light ` . : / + o edges around a dense z-fill core
export const ART_LINES = [
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
  "    `.:/+ooozzzzzzzzzzzzzzooo+/:.`    ",
];
export const ART = ART_LINES.join("\n");

export const FACTS: [string, string][] = [
  ["UPTIME", "5 years, still building"],
  ["THEME", "aperture / warm"],
];

/** `tone` is the CSS custom property the group is drawn in. */
export const STACK: { label: string; tone: string; tools: string[] }[] = [
  { label: "LANGUAGES", tone: "--stack-c1", tools: ["Go", "TypeScript", "Python", "C++", "Java", "Bash"] },
  { label: "FRONT-END", tone: "--stack-c2", tools: ["React", "HTML", "CSS", "JavaScript"] },
  { label: "SYSTEMS", tone: "--stack-c3", tools: ["Linux", "Windows Server", "PostgreSQL", "MariaDB", "MongoDB", "Cisco"] },
  { label: "PRACTICES", tone: "--stack-c4", tools: ["Docker", "CI/CD", "OOP"] },
];
