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
  scale: 1,
  color: "var(--font-color)",
  backgroundColor: "var(--bg-color)"
});

addChordC();
addChordBb();

function addChordC() {
  guitarChordsSection.addChord("x32010", "032010", {
    label: "C"
  });
}

function addChordBb() {
  const frets = "x13231";
  const fingers = "013241";
  const barres = guitarChordsSection.determineBarreOptions(frets, fingers, [1]);

  guitarChordsSection.addChord(frets, fingers, {
    label: "Bbmaj7",
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