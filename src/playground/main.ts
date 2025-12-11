import MusicStaff from '../classes/MusicStaff';
import './style.css'

const element = document.getElementById("staff-root");

if (!element) {
  throw new Error("Required DOM element with ID 'staff-root' not found.");
}

// Class Testing

const musicStaff = new MusicStaff(element, {
  width: 300,
  scale: 2,
  staffType: "treble"
});

// Index Elements

const elements = {
  testButton: document.getElementById("test-button"),
}

// Event Listeners
elements.testButton?.addEventListener("click", () => {
  musicStaff.drawNote("C4");
});