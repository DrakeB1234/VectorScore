import 'render-scan';
import "./guitar";
import "./notation";

// Navbar Functionality
type Section = "notation" | "guitar";

const notationSection = document.getElementById("section-notation");
const guitarSection = document.getElementById("section-guitar");

if (!notationSection || !guitarSection) {
  throw new Error("main.ts: Required DOM elements not found.");
};

const domElements = {
  navButtonNotation: document.getElementById("nav-button-notation") as HTMLButtonElement,
  navButtonGuitar: document.getElementById("nav-button-guitar") as HTMLButtonElement,
  buttonThemeToggle: document.getElementById("button-theme-toggle") as HTMLButtonElement,
}

changeSection("notation");

function changeSection(section: Section) {
  if (!guitarSection || !notationSection) return;
  guitarSection.classList = "hide";
  notationSection.classList = "hide";
  domElements.navButtonNotation.classList.remove("active");
  domElements.navButtonGuitar.classList.remove("active");

  if (section === "notation") {
    notationSection.classList = "";
    domElements.navButtonNotation.classList.add("active");
  }
  if (section === "guitar") {
    guitarSection.classList = "";
    domElements.navButtonGuitar.classList.add("active");
  }

  window.scrollTo({ top: 0 });
}

domElements.navButtonNotation?.addEventListener("click", () => {
  changeSection("notation");
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