import GuitarChord from "../classes/GuitarChord";

const rendererRootElement = document.getElementById("guitar-chords-root");

if (!rendererRootElement) {
  throw new Error("guitar.ts: Required DOM elements not found.");
}

const domElements = {
  buttonTest: document.getElementById("guitar-button-test") as HTMLButtonElement,
  buttonAddChord: document.getElementById("guitar-button-addchord") as HTMLButtonElement,
  buttonModifyChord: document.getElementById("guitar-button-modifychord") as HTMLButtonElement,

  inputModifyChordFrets: document.getElementById("guitar-input-modifychord-frets") as HTMLInputElement,
  inputModifyChordFingers: document.getElementById("guitar-input-modifychord-fingers") as HTMLInputElement,
  inputModifyChordStartingFret: document.getElementById("guitar-input-modifychord-startingfret") as HTMLInputElement,
  inputModifyChordLabel: document.getElementById("guitar-input-modifychord-label") as HTMLInputElement,
  inputModifyChordBarreFret: document.getElementById("guitar-input-modifychord-barrefret") as HTMLInputElement,
  inputModifyChordIdx: document.getElementById("guitar-input-modifychord-idx") as HTMLInputElement,

  inputRemoveChordIdx: document.getElementById("guitar-input-removechord-idx") as HTMLInputElement,
  buttonRemoveChord: document.getElementById("guitar-button-removechord") as HTMLButtonElement,
}

const guitarChordsSection = new GuitarChord(rendererRootElement, {
  fretCount: 5,
  stringCount: 6,
  stringLabels: ["E", "A", "D", "G", "B", "E"],
  inlineChordsAmount: 4,
  centerChords: true,
  scale: 1,
  svgAutoFill: false
});

addChordC();
addChordEaug9();
// addChordBbmaj7();
addChordF();
// addChordBmaj9();
addChordBm7b5();

function addChordC() {
  guitarChordsSection.addChord("x32010", "032010", {
    label: "C"
  });
}

function addChordBbmaj7() {
  const frets = "687766";
  const fingers = "142311";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [6]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Bbmaj7",
    barres: barres
  });
}

function addChordBm7b5() {
  const frets = "7897a7";
  const fingers = "123141";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [7]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Bm7b5",
    barres: barres
  });
}

// Incorrect barre line placement from determineBarreOptions
// Works as of 1.2.1
function addChordEaug9() {
  const frets = "x76778";
  const fingers = "021334";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [7]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Eaug9",
    barres: barres
  });
}

// Incorrect barre line placement from determineBarreOptions
// Works as of 1.2.1
function addChordBmaj9() {
  const frets = "22132x";
  const fingers = "221430";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [2]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Bmaj9",
    barres: barres
  });
}

function addChordF() {
  const frets = "133211";
  const fingers = "134211";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [1]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Fmajor",
    barres: barres
  });
}

function handleTest() {
  // @ts-ignore
  console.log(guitarChordsSection.chordEntries)
}

function handleAddChord() {
  const frets = domElements.inputModifyChordFrets.value;
  const fingers = domElements.inputModifyChordFingers.value;
  const startingFret = Number(domElements.inputModifyChordStartingFret.value);
  const label = domElements.inputModifyChordLabel.value ?? undefined;

  const barreFret = domElements.inputModifyChordBarreFret.value;
  const barreFretParts = barreFret.split("/");
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, barreFretParts.map(e => Number(e)));

  guitarChordsSection.addChord(frets, fingers, {
    startFret: startingFret !== 0 ? startingFret : undefined,
    label: label,
    barres: barres.length ? barres : undefined
  });
}

function handleModifyChord() {
  const frets = domElements.inputModifyChordFrets.value;
  const fingers = domElements.inputModifyChordFingers.value;
  const startingFret = Number(domElements.inputModifyChordStartingFret.value);
  const label = domElements.inputModifyChordLabel.value ?? undefined;
  const chordIdx = Number(domElements.inputModifyChordIdx.value) - 1;

  const barreFret = domElements.inputModifyChordBarreFret.value;
  const barreFretParts = barreFret.split("/");
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, barreFretParts.map(e => Number(e)));

  guitarChordsSection.modifyChordByIndex(frets, fingers, chordIdx, {
    startFret: startingFret !== 0 ? startingFret : undefined,
    label: label,
    barres: barres.length ? barres : undefined
  });
}

function handleRemoveChord() {
  const idx = Math.max(Number(domElements.inputRemoveChordIdx.value) - 1, 0);

  guitarChordsSection.removeChordByIndex(idx);
}

domElements.buttonTest.addEventListener("click", handleTest);
domElements.buttonAddChord.addEventListener("click", handleAddChord);
domElements.buttonModifyChord.addEventListener("click", handleModifyChord);
domElements.buttonRemoveChord.addEventListener("click", handleRemoveChord);