document.addEventListener("DOMContentLoaded", () => {
    const projectCards = document.querySelectorAll(".project-card");
    const modal = document.getElementById("project-preview-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const iframe = document.getElementById("project-iframe");
  
    projectCards.forEach((card) => {
      card.addEventListener("click", () => {
        const projectId = card.getAttribute("data-project-id");
        const projectURL = `path/to/${projectId}-project-page.html`;
        iframe.src = projectURL;
        modal.style.display = "block";
      });
    });
  
    closeModalBtn.addEventListener("click", () => {
      modal.style.display = "none";
      iframe.src = ""; // Clear the iframe source
    });
  });