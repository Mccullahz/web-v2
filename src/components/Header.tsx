// same as footer, just throwing the html in here for now, refactor later
export function Header(): string {
  return `
  <header class="header" data-header>
    <div class="container">
      <a href="/" class="logo">McCullah</a>
      <nav class="navbar" data-navbar>
        <ul class="navbar-list">
          <li><a href="#home" class="navbar-link" data-nav-link>Home</a></li>
          <li><a href="#portfolio" class="navbar-link" data-nav-link>Portfolio</a></li>
          <li><a href="#workexp" class="navbar-link" data-nav-link>Experience</a></li>
          <li><a href="#contact" class="navbar-link" data-nav-link>Contact</a></li>
        </ul>
      </nav>
      <button class="nav-toggle-btn" aria-label="toggle menu" data-nav-toggler>
        <span class="line line-1"></span>
        <span class="line line-2"></span>
        <span class="line line-3"></span>
      </button>
    </div>
  </header>`;
}

