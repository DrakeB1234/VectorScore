import MusicStaff from "../classes/MusicStaff";
import RhythmStaff from "../classes/RhythmStaff";
import ScrollingStaff from "../classes/ScrollingStaff";

type SelectedStaff = {
  element: HTMLElement;
  staff: MusicStaff | RhythmStaff | ScrollingStaff;
  name: string;
}

const rootGrand = document.getElementById("staff-root-grand");
const rootTreble = document.getElementById("staff-root-treble");
const rootBass = document.getElementById("staff-root-bass");
const rootAlto = document.getElementById("staff-root-alto");
const rootScrolling = document.getElementById("staff-root-scrolling");
const rootRhythm = document.getElementById("staff-root-rhythm");

if (!rootGrand || !rootTreble || !rootBass || !rootAlto || !rootScrolling || !rootRhythm) {
  throw new Error("notation.ts: Required DOM domElements not found.");
};

const domElements = {
  buttonTest: document.getElementById("notation-button-test") as HTMLButtonElement,
  buttonAddNotes: document.getElementById("notation-button-addnotes") as HTMLButtonElement,
  buttonAddChord: document.getElementById("notation-button-addchord") as HTMLButtonElement,

  buttonChangeChord: document.getElementById("notation-button-changechord") as HTMLButtonElement,
  buttonChangeNote: document.getElementById("notation-button-changenote") as HTMLButtonElement,
  buttonJustifyNotes: document.getElementById("notation-button-justify") as HTMLButtonElement,
  buttonClearNotes: document.getElementById("notation-button-clearnotes") as HTMLButtonElement,

  inputKey: document.getElementById("notation-input-key") as HTMLInputElement,
  inputTime: document.getElementById("notation-input-time") as HTMLInputElement,
  buttonDrawKey: document.getElementById("notation-button-key") as HTMLButtonElement,
  buttonDrawTime: document.getElementById("notation-button-time") as HTMLButtonElement,

  buttonDrawBeamNotes: document.getElementById("notation-button-drawbeam") as HTMLButtonElement,
  buttonDrawRests: document.getElementById("notation-button-drawrest") as HTMLButtonElement,
  buttonIncrementBeat: document.getElementById("notation-button-incrementbeat") as HTMLButtonElement,
  buttonResetBeat: document.getElementById("notation-button-resetbeat") as HTMLButtonElement,
  buttonCompare: document.getElementById("notation-button-compare") as HTMLButtonElement,
  buttonResetCompare: document.getElementById("notation-button-resetcompare") as HTMLButtonElement,

  buttonFill: document.getElementById("notation-button-fill") as HTMLButtonElement,
  buttonAdvance: document.getElementById("notation-button-advance") as HTMLButtonElement,

  inputStaff: document.getElementById("notation-select-staff") as HTMLSelectElement,
  inputNoteIndex: document.getElementById("notation-input-index") as HTMLInputElement,
  inputNotes: document.getElementById("notation-input-notes") as HTMLInputElement,
  inputActionNotes: document.getElementById("notation-input-actionnotes") as HTMLInputElement,
};

const musicStaffGrand = new MusicStaff(rootGrand, {
  width: 450,
  scale: 1.2,
  svgAutoFill: true,
  // noteStartX: 0,
  padding: 50,
  staffType: "grand",
  keySignature: "G",
  timeSignature: {
    topNumber: 4,
    bottomNumber: 4
  },

  // spaceAbove: 0,
  // spaceBelow: 3,
});

const musicStaffTreble = new MusicStaff(rootTreble, {
  width: 350,
  scale: 1.4,
  staffType: "treble",
  keySignature: "G",
  timeSignature: {
    topNumber: 4,
    bottomNumber: 8
  },

  // spaceBelow: 2,
  // spaceAbove: 4
});

const musicStaffBass = new MusicStaff(rootBass, {
  width: 350,
  scale: 1.4,
  staffType: "bass",
  keySignature: "G",
  timeSignature: {
    topNumber: 4,
    bottomNumber: 4
  },

  // spaceAbove: 2,
  // spaceBelow: 0,
});

const musicStaffAlto = new MusicStaff(rootAlto, {
  width: 350,
  scale: 1.4,
  staffType: "alto",
  keySignature: "F#",

  // spaceAbove: 1,
  // spaceBelow: 1,
});

const scrollingStaff = new ScrollingStaff(rootScrolling, {
  width: 350,
  scale: 1.4,
  noteStartX: 20,
  onNotesOut: onScrollingStaffOut,
  staffType: "grand",
  // keySignature: "D",
  timeSignature: {
    topNumber: 4,
    bottomNumber: 4
  },

  // spaceAbove: 1,
  // spaceBelow: 1,
});

const rhythmStaff = new RhythmStaff(rootRhythm, {
  width: 400,
  scale: 1.4,
  topNumber: 4,
  barsCount: 2,

  // spaceAbove: 0,
  // spaceBelow: 0,
});

let selectedStaff: SelectedStaff = {
  element: rootGrand,
  staff: musicStaffGrand,
  name: "grand"
};

changeStaff("grand");

function onScrollingStaffOut() {
  console.log("OUT HANDLED")
}

function changeStaff(name: string) {
  selectedStaff.element.classList.remove('show');

  switch (name) {
    case "grand":
      selectedStaff = {
        element: rootGrand!,
        staff: musicStaffGrand,
        name: "grand"
      }
      break;
    case "treble":
      selectedStaff = {
        element: rootTreble!,
        staff: musicStaffTreble,
        name: "treble"
      }
      break;
    case "bass":
      selectedStaff = {
        element: rootBass!,
        staff: musicStaffBass,
        name: "bass"
      }
      break;
    case "alto":
      selectedStaff = {
        element: rootAlto!,
        staff: musicStaffAlto,
        name: "alto"
      }
      break;
    case "scrolling":
      selectedStaff = {
        element: rootScrolling!,
        staff: scrollingStaff,
        name: "scrolling"
      }
      break;
    case "rhythm":
      selectedStaff = {
        element: rootRhythm!,
        staff: rhythmStaff,
        name: "rhythm"
      }
      break;
  };

  selectedStaff.element.classList.add("show");
  domElements.inputStaff.value = selectedStaff.name;
};

domElements.buttonDrawKey?.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;
  const key = domElements.inputKey.value;

  selectedStaff.staff.changeKeySignature(key);
});

domElements.buttonDrawTime?.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;
  const time = domElements.inputTime.value;
  const timeParts = time.split(",");

  const topTime = Number(timeParts[0]);
  const bottomTime = Number(timeParts[1]);

  selectedStaff.staff.changeTimeSignature(topTime, bottomTime);
});

domElements.buttonTest?.addEventListener("click", () => {
  if (!(selectedStaff.staff instanceof MusicStaff)) return;
  const note = domElements.inputNotes.value;

  selectedStaff.staff.devDrawNote(note);
})

domElements.buttonFill?.addEventListener("click", () => {
  scrollingStaff.queueNotes(["C4", "D4", ["C4", "E#4", "F4"], "A3", "B3", "C4", "C4", ["C4", "E#4", "G#4"], "A4", "B4", "C4", "C4", ["C4", "E#4", "G#4"], "A4", "A4", "A4", "A4", "A4", "A4", "A4"]);
})
domElements.buttonAdvance?.addEventListener("click", () => {
  scrollingStaff.advanceNotes();
})

domElements.buttonChangeNote.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  const noteIndexRawValue = domElements.inputNoteIndex.value;
  const noteIndex = Number(noteIndexRawValue);
  if (typeof noteIndex !== "number") return;
  const notesRawString = domElements.inputActionNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  selectedStaff.staff.changeNoteByIndex(noteParts[0], noteIndex);
})

domElements.buttonChangeChord.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  const noteIndexRawValue = domElements.inputNoteIndex.value;
  const noteIndex = Number(noteIndexRawValue);
  if (typeof noteIndex !== "number") return;
  const notesRawString = domElements.inputActionNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  selectedStaff.staff.changeChordByIndex(noteParts, noteIndex);
})

domElements.buttonAddNotes?.addEventListener("click", () => {
  if (selectedStaff.staff instanceof ScrollingStaff) return;

  const notesRawString = domElements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  selectedStaff.staff.drawNote(noteParts);
});

domElements.buttonAddChord?.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  const notesRawString = domElements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  selectedStaff.staff.drawChord(noteParts);
});

domElements.buttonDrawBeamNotes.addEventListener("click", () => {
  if (selectedStaff.staff instanceof MusicStaff) return;
  const notesRawString = domElements.inputNotes.value;
  const noteParts = notesRawString.split("/");

  if (noteParts.length < 2) return;
  rhythmStaff.drawBeamedNotes(noteParts[0] as "e" | "s", noteParts.length);
});

domElements.buttonDrawRests.addEventListener("click", () => {
  if (selectedStaff.staff instanceof MusicStaff) return;

  const notesRawString = domElements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

  rhythmStaff.drawRest(noteParts);
});

domElements.buttonJustifyNotes?.addEventListener("click", () => {
  if (selectedStaff.staff instanceof RhythmStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  selectedStaff.staff.justifyNotes();
});

domElements.buttonClearNotes?.addEventListener("click", () => {
  selectedStaff.staff.clearAllNotes();
});

domElements.inputStaff.addEventListener("change", (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const value = target.value;

  changeStaff(value);
});

domElements.buttonIncrementBeat.addEventListener("click", () => {
  if (selectedStaff.staff instanceof MusicStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  selectedStaff.staff.incrementCurrentBeatUI();
});

domElements.buttonResetBeat.addEventListener("click", () => {
  if (selectedStaff.staff instanceof MusicStaff || selectedStaff.staff instanceof ScrollingStaff) return;

  selectedStaff.staff.resetCurrentBeatUI();
});

domElements.buttonCompare.addEventListener("click", () => {
  if (selectedStaff.staff instanceof MusicStaff) return;
  const notesRawString = domElements.inputNotes.value;
  if (!notesRawString) return;
  const noteParts = notesRawString.split("/");

})