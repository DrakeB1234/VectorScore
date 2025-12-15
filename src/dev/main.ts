import MusicStaff from '../classes/MusicStaff';
import RhythmStaff from '../classes/RhythmStaff';
import './style.css'

const grandRoot = document.getElementById("staff-root-grand");
const trebleRoot = document.getElementById("staff-root-treble");
const bassRoot = document.getElementById("staff-root-bass");
const altoRoot = document.getElementById("staff-root-alto");

const rhythmRoot = document.getElementById("staff-root-rhythm");

if (!trebleRoot || !bassRoot || !grandRoot || !altoRoot || !rhythmRoot) {
  throw new Error("Required DOM elements not found.");
}

// Class Testing

const musicStaffGrand = new MusicStaff(grandRoot, {
  staffType: "grand",
  width: 350,
  scale: 1.2,
  // staffColor: "#f2f4ff",
  // staffBackgroundColor: "#2f3040",
  spaceAbove: 0,
  spaceBelow: 3
});

const musicStaffTreble = new MusicStaff(trebleRoot, {
  width: 350,
  scale: 1.2,
  staffType: "treble",
  spaceBelow: 1
});

const musicStaffBass = new MusicStaff(bassRoot, {
  width: 350,
  scale: 1.2,
  staffType: "bass",
  spaceAbove: 2,
  spaceBelow: 0,
});

const musicStaffAlto = new MusicStaff(altoRoot, {
  width: 350,
  scale: 1.2,
  staffType: "alto",
  spaceAbove: 1,
  spaceBelow: 1,
});

const rhythmStaff = new RhythmStaff(rhythmRoot, {
  width: 350,
  scale: 1.2,
  topNumber: 4,
  spaceAbove: 0,
  spaceBelow: 0,
});

musicStaffGrand.drawNote(["c#5w", "b#4e", "a#4e", "c#4e", "a#3e", "d#3e", "c#3e"]);
musicStaffTreble.drawNote(["c4e", "b4e", "a5e"]);
musicStaffBass.drawNote(["C4w", "D3w", "C3w"]);
musicStaffAlto.drawNote(["C4w", "G4w", "F3w"]);

function toggleWrongNoteUI(staff: string, note: string, index: number) {
  switch (staff) {
    case "grand":
      musicStaffGrand.showWrongNoteUIByNoteIndex(note, index);
      break;
    case "treble":
      musicStaffTreble.showWrongNoteUIByNoteIndex(note, index);
      break;
    case "bass":
      musicStaffBass.showWrongNoteUIByNoteIndex(note, index);
      break;
    case "alto":
      musicStaffAlto.showWrongNoteUIByNoteIndex(note, index);
      break;
  };

  setTimeout(() => {
    switch (staff) {
      case "grand":
        musicStaffGrand.hideWrongNoteUI();
        break;
      case "treble":
        musicStaffTreble.hideWrongNoteUI();
        break;
      case "bass":
        musicStaffBass.hideWrongNoteUI();
        break;
      case "alto":
        musicStaffAlto.hideWrongNoteUI();
        break;
    };
  }, 1000);
};

// Index Elements
const elements = {
  buttonDrawNotes: document.getElementById("button-draw") as HTMLButtonElement,
  buttonDrawBeamNotes: document.getElementById("button-draw-beam") as HTMLButtonElement,
  buttonDrawRests: document.getElementById("button-draw-rest") as HTMLButtonElement,
  buttonJustifyNotes: document.getElementById("button-justify") as HTMLButtonElement,
  buttonErrorNote: document.getElementById("button-error") as HTMLButtonElement,
  buttonClearNotes: document.getElementById("button-clear") as HTMLButtonElement,

  inputStaff: document.getElementById("input-select-staff") as HTMLSelectElement,
  inputNoteIndex: document.getElementById("input-number-index") as HTMLInputElement,
  inputNotes: document.getElementById("input-text-notes") as HTMLInputElement,
}

// Event Listeners
elements.buttonDrawNotes?.addEventListener("click", () => {
  const notesRawString = elements.inputNotes.value;
  const staffRawString = elements.inputStaff.value;
  // if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  switch (staffRawString) {
    case "grand":
      musicStaffGrand.drawNote(noteParts);
      break;
    case "treble":
      musicStaffTreble.drawNote(noteParts);
      break;
    case "bass":
      musicStaffBass.drawNote(noteParts);
      break;
    case "alto":
      musicStaffAlto.drawNote(noteParts);
      break;
    case "rhythm":
      rhythmStaff.drawNote(noteParts);
      break;
  };
});

elements.buttonDrawBeamNotes.addEventListener("click", () => {
  const noteIndexRawValue = elements.inputNoteIndex.value;
  const noteIndex = Number(noteIndexRawValue);
  if (typeof noteIndex !== "number" || noteIndex < 1) return;
  rhythmStaff.drawBeamedNotes("e", noteIndex);
});

elements.buttonDrawRests.addEventListener("click", () => {
  const notesRawString = elements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  rhythmStaff.drawRest(noteParts);
});

elements.buttonJustifyNotes?.addEventListener("click", () => {
  const staffRawString = elements.inputStaff.value;

  switch (staffRawString) {
    case "grand":
      musicStaffGrand.justifyNotes();
      break;
    case "treble":
      musicStaffTreble.justifyNotes();
      break;
    case "bass":
      musicStaffBass.justifyNotes();
      break;
    case "alto":
      musicStaffAlto.justifyNotes();
      break;
  };
});

elements.buttonErrorNote?.addEventListener("click", () => {
  const noteIndexRawValue = elements.inputNoteIndex.value;
  const noteIndex = Number(noteIndexRawValue);
  if (typeof noteIndex !== "number") return;
  const notesRawString = elements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  const staffRawString = elements.inputStaff.value;

  toggleWrongNoteUI(staffRawString, noteParts[0], noteIndex);
});

elements.buttonClearNotes?.addEventListener("click", () => {
  const staffRawString = elements.inputStaff.value;

  switch (staffRawString) {
    case "grand":
      musicStaffGrand.clearAllNotes();
      break;
    case "treble":
      musicStaffTreble.clearAllNotes();
      break;
    case "bass":
      musicStaffBass.clearAllNotes();
      break;
    case "alto":
      musicStaffAlto.clearAllNotes();
      break;
    case "rhythm":
      rhythmStaff.clearAllNotes();
      break;
  };
});