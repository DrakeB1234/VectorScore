import DevStaff from "./DevStaff";


const root = document.getElementById("staff-root-dev");

if (!root) throw new Error("")

const devStaff = new DevStaff(root, {
  width: 1000,
  scale: 1,
  svgAutoFill: false
});

const testNoteStr = "C4q [C4,E4,G4]q Rq F#4e-G4e";
const testNoteStr2 = "Rq Rq Rh F#4q [C4,E4,G4]q [G3,B3,D4]q [Bb3,D4,F4]w [C#4,F#4,G#4,A4,B4]q";
const testNoteStr3 = "Rq [E4,C4]e [B4,D5]e C5s B4s";

// devStaff.testMethod(testNoteStr3); 

devStaff.testMethod(
  ["C4e-D4e-E4e-F4e G4e A4e B4e C5e", "C5h C4h", "C4w", "[C#4,E#4,G#4,B#4]q [C#4,D#4,E#4]q"],
  ["C3h G3h", "C3w"]
);