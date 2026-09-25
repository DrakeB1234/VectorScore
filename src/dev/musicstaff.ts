import MusicStaff, { type MusicStaffUserOptions } from "../core/MusicStaff";

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

  inputNote: document.getElementById("musicstaff-input-note") as HTMLInputElement,
  inputNoteIsTop: document.getElementById("musicstaff-input-note-istop") as HTMLInputElement,
  buttonAddNote: document.getElementById("musicstaff-button-addnote") as HTMLButtonElement,

  inputChord: document.getElementById("musicstaff-input-chord") as HTMLInputElement,
  inputChordDuration: document.getElementById("musicstaff-input-chord-duration") as HTMLInputElement,
  inputChordIsTop: document.getElementById("musicstaff-input-chord-istop") as HTMLInputElement,
  buttonAddChord: document.getElementById("musicstaff-button-addchord") as HTMLButtonElement,

  inputKey: document.getElementById("musicstaff-input-key") as HTMLInputElement,
  buttonKeyAdd: document.getElementById("musicstaff-button-key-add") as HTMLButtonElement,
  buttonKeyRemove: document.getElementById("musicstaff-button-key-remove") as HTMLButtonElement,

  inputTimeTop: document.getElementById("musicstaff-input-time-top") as HTMLInputElement,
  inputTimeBottom: document.getElementById("musicstaff-input-time-bottom") as HTMLInputElement,
  buttonTimeAdd: document.getElementById("musicstaff-button-time-add") as HTMLButtonElement,
  buttonTimeRemove: document.getElementById("musicstaff-button-time-remove") as HTMLButtonElement,
};

domElements.staffSelect.addEventListener("change", (e) => {
  const target = e.target as HTMLSelectElement;
  changeStaff(target.value as Staffs);
})

domElements.buttonAddNote.addEventListener("click", () => {
  const value = domElements.inputNote.value;
  const isTop = Boolean(domElements.inputNoteIsTop.checked);

  currentStaff.drawNote(value, {
    staff: isTop ? "top" : "bottom"
  });
})

domElements.buttonAddChord.addEventListener("click", () => {
  const value = domElements.inputChord.value;
  const valueParts = value.split("/");
  const valueDuration = domElements.inputChordDuration.value;
  const isTop = Boolean(domElements.inputChordIsTop.checked);

  currentStaff.drawChord(valueParts, valueDuration as any, {
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