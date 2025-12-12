import MusicStaff from '../classes/MusicStaff';
import './style.css'

const grandRoot = document.getElementById("staff-root-grand");
const trebleRoot = document.getElementById("staff-root-treble");
const bassRoot = document.getElementById("staff-root-bass");

if (!trebleRoot || !bassRoot || !grandRoot) {
  throw new Error("Required DOM elements not found.");
}

// Class Testing

const musicStaffGrand = new MusicStaff(grandRoot, {
  width: 300,
  scale: 2,
  staffType: "grand",
  spaceAbove: 0,
  spaceBelow: 3
});

const musicStaffTreble = new MusicStaff(trebleRoot, {
  width: 300,
  scale: 2,
  staffType: "treble",
  spaceBelow: 1
});

const musicStaffBass = new MusicStaff(bassRoot, {
  width: 300,
  scale: 2,
  staffType: "bass",
  spaceAbove: 2,
  spaceBelow: 0,
});

function addNotesToStaff(staff: "grand" | "treble" | "bass") {
  switch (staff) {
    case "grand":
      // musicStaffGrand.drawNote(["C6w", "C2h", "Cb4q"]);
      musicStaffGrand.drawNote(["C4w", "C#4w", "C4h", "C4q", "C5", "A5", "E#2q", "C2", "D2"]);
      break;
    case "treble":
      musicStaffTreble.drawNote(["B3", "C4", "E4", "G4", "B4"]);
      break;
    case "bass":
      musicStaffBass.drawNote(["D4", "C4q", "B3", "A3", "F3"]);
      break;
  }
}

addNotesToStaff("grand");
addNotesToStaff("treble");
addNotesToStaff("bass");

// Index Elements
const elements = {
  testButtonGrand: document.getElementById("test-button-grand"),
  testButtonTreble: document.getElementById("test-button-treble"),
  testButtonBass: document.getElementById("test-button-bass"),
}

// Event Listeners
elements.testButtonGrand?.addEventListener("click", () => {
});
elements.testButtonTreble?.addEventListener("click", () => {
});
elements.testButtonBass?.addEventListener("click", () => {
});