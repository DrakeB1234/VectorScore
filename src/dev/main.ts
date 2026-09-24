import 'render-scan';
import "./guitar";
import "./musicstaff";

// Navbar Functionality
type Section = "musicstaff" | "guitar";

const musicStaffSection = document.getElementById("section-musicstaff");
const guitarSection = document.getElementById("section-guitar");

if (!musicStaffSection || !guitarSection) {
  throw new Error("main.ts: Required DOM elements not found.");
};

const domElements = {
  navButtonNotation: document.getElementById("nav-button-musicstaff") as HTMLButtonElement,
  navButtonGuitar: document.getElementById("nav-button-guitar") as HTMLButtonElement,
  buttonThemeToggle: document.getElementById("button-theme-toggle") as HTMLButtonElement,
}

changeSection("musicstaff");

function changeSection(section: Section) {
  if (!guitarSection || !musicStaffSection) return;
  guitarSection.classList = "hide";
  musicStaffSection.classList = "hide";
  domElements.navButtonNotation.classList.remove("active");
  domElements.navButtonGuitar.classList.remove("active");

  if (section === "musicstaff") {
    musicStaffSection.classList = "";
    domElements.navButtonNotation.classList.add("active");
  }
  if (section === "guitar") {
    guitarSection.classList = "";
    domElements.navButtonGuitar.classList.add("active");
  }

  window.scrollTo({ top: 0 });
}

domElements.navButtonNotation?.addEventListener("click", () => {
  changeSection("musicstaff");
});
domElements.navButtonGuitar?.addEventListener("click", () => {
  changeSection("guitar");
});

domElements.buttonThemeToggle?.addEventListener("click", () => {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme");

  if (theme === "dark") {
    root.setAttribute("data-theme", "light");
  }
  else {
    root.setAttribute("data-theme", "dark");
  }
});