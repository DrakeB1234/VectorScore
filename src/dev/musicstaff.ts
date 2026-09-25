import MusicStaff, { type ReplaceConfig, type MusicStaffUserOptions, type NoteReplaceConfig, type DrawOptions, type ChordReplaceConfig, type RestReplaceConfig } from "../core/MusicStaff";

const rootGrand = document.getElementById("staff-root-grand");
const rootTreble = document.getElementById("staff-root-treble");
const rootBass = document.getElementById("staff-root-bass");
const rootAlto = document.getElementById("staff-root-alto");

if (!rootGrand || !rootTreble || !rootBass || !rootAlto) {
  throw new Error("musicstaff.ts: Required DOM domElements not found.");
};

const staffRoots = [rootGrand, rootTreble, rootBass, rootAlto];

const defaultStaffOptions: MusicStaffUserOptions = {
  width: 450,
  scale: 1,
  svgAutoFill: true,
  staffType: "grand",
  paddingTop: 40,
  paddingBottom: 40,
  keySignature: "G",
  timeSignature: {
    topNumber: 4,
    bottomNumber: 4
  },
}

const musicStaffGrand = new MusicStaff(rootGrand, defaultStaffOptions);
const musicStaffTreble = new MusicStaff(rootTreble, { ...defaultStaffOptions, staffType: "treble" });
const musicStaffBass = new MusicStaff(rootBass, { ...defaultStaffOptions, staffType: "bass" });
const musicStaffAlto = new MusicStaff(rootAlto, { ...defaultStaffOptions, staffType: "alto" });

type Staffs = "grand" | "treble" | "bass" | "alto";

let currentStaff = musicStaffGrand;

function changeStaff(staff: Staffs) {
  staffRoots.forEach(root => root.classList.remove("show"));

  switch (staff) {
    case "grand": {
      rootGrand?.classList.add("show");
      currentStaff = musicStaffGrand
      return;
    }
    case "treble": {
      rootTreble?.classList.add("show");
      currentStaff = musicStaffTreble
      return;
    }
    case "bass": {
      rootBass?.classList.add("show");
      currentStaff = musicStaffBass
      return;
    }
    case "alto": {
      rootAlto?.classList.add("show");
      currentStaff = musicStaffAlto
      return;
    }
  }
};

changeStaff("grand");

const domElements = {
  staffSelect: document.getElementById("musicstaff-select-staff") as HTMLSelectElement,

  inputIsTop: document.getElementById("musicstaff-input-istop") as HTMLInputElement,

  inputNote: document.getElementById("musicstaff-input-note") as HTMLInputElement,
  buttonAddNote: document.getElementById("musicstaff-button-addnote") as HTMLButtonElement,

  inputChord: document.getElementById("musicstaff-input-chord") as HTMLInputElement,
  inputChordDuration: document.getElementById("musicstaff-input-chord-duration") as HTMLInputElement,
  buttonAddChord: document.getElementById("musicstaff-button-addchord") as HTMLButtonElement,

  inputRestDuration: document.getElementById("musicstaff-input-rest-duration") as HTMLInputElement,
  buttonAddRest: document.getElementById("musicstaff-button-addrest") as HTMLButtonElement,

  inputKey: document.getElementById("musicstaff-input-key") as HTMLInputElement,
  buttonKeyAdd: document.getElementById("musicstaff-button-key-add") as HTMLButtonElement,
  buttonKeyRemove: document.getElementById("musicstaff-button-key-remove") as HTMLButtonElement,

  inputTimeTop: document.getElementById("musicstaff-input-time-top") as HTMLInputElement,
  inputTimeBottom: document.getElementById("musicstaff-input-time-bottom") as HTMLInputElement,
  buttonTimeAdd: document.getElementById("musicstaff-button-time-add") as HTMLButtonElement,
  buttonTimeRemove: document.getElementById("musicstaff-button-time-remove") as HTMLButtonElement,

  buttonActionClear: document.getElementById("musicstaff-button-action-clear") as HTMLButtonElement,
  buttonActionJustify: document.getElementById("musicstaff-button-action-justify") as HTMLButtonElement,
};

domElements.staffSelect.addEventListener("change", (e) => {
  const target = e.target as HTMLSelectElement;
  changeStaff(target.value as Staffs);
})

domElements.buttonAddNote.addEventListener("click", () => {
  const value = domElements.inputNote.value;
  const isTop = Boolean(domElements.inputIsTop.checked);

  currentStaff.drawNote(value, {
    staff: isTop ? "top" : "bottom"
  });
})

domElements.buttonAddChord.addEventListener("click", () => {
  const value = domElements.inputChord.value;
  const valueParts = value.split("/");
  const valueDuration = domElements.inputChordDuration.value;
  const isTop = Boolean(domElements.inputIsTop.checked);

  currentStaff.drawChord(valueParts, valueDuration as any, {
    staff: isTop ? "top" : "bottom"
  });
})

domElements.buttonAddRest.addEventListener("click", () => {
  const value = domElements.inputRestDuration.value;
  const isTop = Boolean(domElements.inputIsTop.checked);

  currentStaff.drawRest(value as any, {
    staff: isTop ? "top" : "bottom"
  });
})

domElements.buttonKeyAdd.addEventListener("click", () => {
  const value = domElements.inputKey.value;

  currentStaff.changeKeySignature(value as any);
})

domElements.buttonKeyRemove.addEventListener("click", () => {
  currentStaff.removeKeySignature();
})

domElements.buttonTimeAdd.addEventListener("click", () => {
  const topValue = Number(domElements.inputTimeTop.value);
  const bottomValue = Number(domElements.inputTimeBottom.value);

  currentStaff.changeTimeSignature(topValue, bottomValue);
})

domElements.buttonTimeRemove.addEventListener("click", () => {
  currentStaff.removeTimeSignature();
})

domElements.buttonActionClear.addEventListener("click", () => {
  currentStaff.clearAllNotes();
})

domElements.buttonActionJustify.addEventListener("click", () => {
  currentStaff.justifyNotes();
})

// ==== REPLACE ====

const replaceInputElements = {
  noteDiv: document.getElementById("replace-note") as HTMLDivElement,
  chordDiv: document.getElementById("replace-chord") as HTMLDivElement,
  restDiv: document.getElementById("replace-rest") as HTMLDivElement,

  selectReplace: document.getElementById("musicstaff-select-replace") as HTMLSelectElement,
  inputIndex: document.getElementById("musicstaff-input-replace-index") as HTMLInputElement,
  inputIsTop: document.getElementById("musicstaff-input-replace-istop") as HTMLInputElement,

  inputNote: document.getElementById("musicstaff-input-replace-note") as HTMLInputElement,

  inputChord: document.getElementById("musicstaff-input-replace-chord") as HTMLInputElement,
  inputChordDuration: document.getElementById("musicstaff-input-replace-chord-duration") as HTMLInputElement,

  inputRest: document.getElementById("musicstaff-input-replace-rest") as HTMLInputElement,

  buttonReplace: document.getElementById("musicstaff-button-replace") as HTMLButtonElement,
}

type Replace = "note" | "chord" | "rest";

function changeReplace(replace: Replace) {
  Object.entries(replaceInputElements).filter(e => e[0].includes("Div")).map(e => e[1].classList.remove("show"));

  if (replace === "note") {
    replaceInputElements.noteDiv.classList.add("show");
  };
  if (replace === "chord") {
    replaceInputElements.chordDiv.classList.add("show");
  };
  if (replace === "rest") {
    replaceInputElements.restDiv.classList.add("show");
  };
};

changeReplace("note");

replaceInputElements.selectReplace.addEventListener("change", (e) => {
  const target = e.target as HTMLSelectElement;
  changeReplace(target.value as Replace);
})

replaceInputElements.buttonReplace.addEventListener("click", () => {
  const index = Number(replaceInputElements.inputIndex.value);
  const type = replaceInputElements.selectReplace.value;
  const isTop = replaceInputElements.inputIsTop.checked;

  const drawOptions: DrawOptions = {
    staff: isTop ? "top" : "bottom"
  }

  if (type === "note") {
    const note = replaceInputElements.inputNote.value;

    currentStaff.replaceByIndex(index, { type: type, note: note } as NoteReplaceConfig, drawOptions);
  };
  if (type === "chord") {
    const chord = replaceInputElements.inputChord.value;
    const duration = replaceInputElements.inputChordDuration.value;
    const chordParts = chord.split("/");

    currentStaff.replaceByIndex(index, { type: type, notes: chordParts, duration } as ChordReplaceConfig, drawOptions);
  };
  if (type === "rest") {
    const duration = replaceInputElements.inputRest.value;

    currentStaff.replaceByIndex(index, { type: type, duration } as RestReplaceConfig, drawOptions);
  };
})