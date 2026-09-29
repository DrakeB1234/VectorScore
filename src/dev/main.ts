import 'render-scan';
import "./guitar";
import "./musicstaff";

// Navbar Functionality
type Section = "musicstaff" | "scrollingstaff" | "guitar";

const musicStaffSection = document.getElementById("section-musicstaff");
const scrollingStaffSection = document.getElementById("section-scrollingstaff");
const guitarSection = document.getElementById("section-guitar");

if (!musicStaffSection || !guitarSection || !scrollingStaffSection) {
  throw new Error("main.ts: Required DOM elements not found.");
};

const domElements = {
  navButtonNotation: document.getElementById("nav-button-musicstaff") as HTMLButtonElement,
  navButtonScrolling: document.getElementById("nav-button-scrollingstaff") as HTMLButtonElement,
  navButtonGuitar: document.getElementById("nav-button-guitar") as HTMLButtonElement,
  buttonThemeToggle: document.getElementById("button-theme-toggle") as HTMLButtonElement,
}

changeSection("musicstaff");

function changeSection(section: Section) {
  if (!guitarSection || !musicStaffSection || !scrollingStaffSection) return;
  guitarSection.classList = "hide";
  musicStaffSection.classList = "hide";
  scrollingStaffSection.classList = "hide";
  domElements.navButtonNotation.classList.remove("active");
  domElements.navButtonScrolling.classList.remove("active");
  domElements.navButtonGuitar.classList.remove("active");

  if (section === "musicstaff") {
    musicStaffSection.classList = "";
    domElements.navButtonNotation.classList.add("active");
  }
  if (section === "scrollingstaff") {
    scrollingStaffSection.classList = "";
    domElements.navButtonScrolling.classList.add("active");
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
domElements.navButtonScrolling?.addEventListener("click", () => {
  changeSection("scrollingstaff");
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