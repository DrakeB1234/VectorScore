import DevStaff from "./DevStaff";


const root = document.getElementById("staff-root-dev");

if (!root) throw new Error("")

const devStaff = new DevStaff(root, {
  width: 800,
  scale: 1,
  svgAutoFill: false
});

const testNoteStr = "C4q [C4,E4,G4]q Rq F#4e-G4e";
const testNoteStr2 = "Rq Rq Rh F#4q Cb5q G4q C6q D3q E3q";

devStaff.testMethod(testNoteStr2);