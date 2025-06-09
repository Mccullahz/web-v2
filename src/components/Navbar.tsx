export function initNavbar() {
  const toggleBtn = document.querySelector("[data-nav-toggler]") as HTMLElement;
  const navbar = document.querySelector("[data-navbar]") as HTMLElement;

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("active");
    navbar.classList.toggle("active");
  });
}
