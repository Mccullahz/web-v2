# Refactoring
## Structure -- Essentially the same as before, but with tailwind we are working inline instead of css files for most things.:
web-v2/
├── public/
│   ├── favicon/
│   ├── images/
│   └── index.html          # Main HTML entry point (Vite handles this)
├── src/
│   ├── assets/
│   │   └── styles -- AXED
│   ├── components/
│   │   ├── Header.ts
│   │   ├── Footer.ts
│   │   ├── Navbar.ts
│   │   └── Card.ts
│   ├── pages/
│   │   ├── Home.ts
│   │   └── Portfolio.ts
│   ├── App.ts
│   └── main.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── index.html


