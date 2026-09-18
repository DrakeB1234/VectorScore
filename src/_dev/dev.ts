import DevStaff from "./DevStaff";


const root = document.getElementById("staff-root-dev");

if (!root) throw new Error("")

const devStaff = new DevStaff(root, {
  width: 800,
  scale: 1.4,
  svgAutoFill: false
});

const testNoteStr = "C4q [C4,E4,G4]q Rq F#4e-G4e";
const testNoteStr2 = "Rq Rq Rh F#4q [C4,E4,G4]q [G3,B3,D4]q [Bb3,D4,F4]w [C#4,F#4,G#4,A4,B4]q";

devStaff.testMethod(testNoteStr2);