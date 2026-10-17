import StandardStaff from "@VS/core/StandardStaff";
import {
  barlineConfig,
  beamConfig,
  chordConfig,
  noteConfig,
  restConfig,
} from "@VS/helpers/inputHelpers";

/** @description Tests the first part in README example */
export function TESTStringDrawing(staff: StandardStaff) {
  staff.drawNote("C4q");

  // Every draw method has optional options object for which staff to draw to and a list of classes to apply to that element
  staff.drawNote("A3h.(staccato)", { staff: "top", classes: ["wrong-note"] });

  staff.drawChord("[C4,E4,G4]q");

  staff.drawRest("Rw");

  staff.drawBeam("C4e-[D4,F4]e-G4e", { staff: "top" });

  staff.drawBarline("|:");
  staff.justifyNotes();
}

/** @description Tests the batch drawing part in README example */
export function TESTBatchStringDrawing(staff: StandardStaff) {
  staff.drawBatchElements("C4w | [C4,E4,G4]q(marcato) Rh B4q(accent) | C4e-[D4,F4]e-G4e-C4e |]", {
    staff: "top",
    classes: ["my-notes"],
  });
  staff.justifyNotes();
}

/** @description Tests the config drawing part in README example */
export function TESTConfigDrawing(staff: StandardStaff) {
  // Not every property is required
  staff.drawNote(
    noteConfig({
      letter: "C",
      octave: 4,
      duration: "s",
      accidental: "#",
      // Optional
      isDotted: true,
      // Optional
      articulation: "tenuto",
    }),
  );

  // Most basic note config
  const reusableNoteConfig = noteConfig({ letter: "C", octave: 4, duration: "q" });

  // Chord notes *DONT* contain duration per note, instead duration is defined top level of chord object.
  const resuableChordConfig = chordConfig({
    notes: [
      {
        letter: "D",
        octave: 4,
      },
      {
        letter: "F",
        octave: 4,
      },
    ],
    duration: "q",
    // Optional
    articulation: "staccato",
    // Optional
    isDotted: undefined,
  });
  staff.drawChord(resuableChordConfig);

  staff.drawRest(
    restConfig({
      duration: "q",
      // Optional
      isDotted: false,
    }),
  );

  staff.drawBarline(barlineConfig("repeat-end"));

  staff.drawBeam(
    beamConfig({
      entries: [
        noteConfig({ letter: "C", octave: 4, duration: "e" }),
        chordConfig({
          notes: [
            { letter: "D", octave: 4 },
            { letter: "F", octave: 4 },
          ],
          duration: "s",
        }),
        noteConfig({ letter: "G", octave: 4, duration: "t" }),
      ],
    }),
  );

  staff.justifyNotes();
}

/** @description Tests the config drawing part in README example */
export function TESTBatchConfigDrawing(staff: StandardStaff) {
  //  Refer to section above for the actual options available in config functions.
  //  Options here are applied per desired element, options are NOT REQUIRED.
  staff.drawBatchElements([
    {
      config: noteConfig({ letter: "C", octave: 4, duration: "q" }),
      options: { staff: "top", classes: ["my-note"] },
    },
    {
      config: chordConfig({
        notes: [
          {
            letter: "D",
            octave: 4,
          },
          {
            letter: "F",
            octave: 4,
          },
        ],
        duration: "q",
      }),
      options: { staff: "bottom" },
    },
    {
      config: restConfig({
        duration: "t",
      }),
    },
    // { config: beamConfig(...) },
    { config: barlineConfig("repeat-end") },
  ]);

  staff.justifyNotes();

  // With options being passed as the second parameter instead of per config entry, its values will be applied to each element drawn.
  // staff.drawBatchElements([...], options: { staff: "top", classes: ["my-note"]});
}

export function TESTDrawScale(staff: StandardStaff) {
  staff.drawBatchElements("C4q D4q E4q F4q G4q A4q B4q");
  staff.justifyNotes();
}

export function TESTBeams(staff: StandardStaff) {
  staff.drawBeam("C4e-E4e-G4e");
  staff.drawBarline("|");
  staff.drawBeam("C4e-E4e-G4e", { staff: "bottom" });
  staff.drawBarline("|");
  staff.drawBeam("C4s-E4e-G4e-C4t");
  staff.drawBarline("|");
  staff.drawBeam("F5e(tenuto)-[D#5, B#4]e-Gbb4e(marcato)");
  staff.justifyNotes();
}

export function TESTRests(staff: StandardStaff) {
  staff.drawBatchElements("Rw Rh Rq Re Rs Rt");
  staff.justifyNotes();
}

export function TESTNotes(staff: StandardStaff) {
  staff.drawBatchElements("F4w F4h F4q F4e F4s F4t");
  staff.justifyNotes();
}

export function TESTBarlines(staff: StandardStaff) {
  staff.drawBatchElements("| || |: :| |]");
  staff.justifyNotes();
}

export function TESTChords(staff: StandardStaff) {
  staff.drawChord("[C4, E4, G4]w");
  staff.drawChord("[C4, E4, G4]w", { staff: "bottom" });
  staff.drawBarline("|");
  staff.drawChord("[C4, E4, G4]q");
  staff.drawChord("[C4, E4, G4]q", { staff: "bottom" });
  staff.drawBarline("|");
  staff.drawChord("[C#4, E#4, G#4]q");
  staff.drawChord("[C#4, E#4, G#4]q", { staff: "bottom" });
  staff.drawBarline("|");
  staff.drawChord("[Cb4, Eb4, Gb4, Bb4]e");
  staff.drawChord("[Cb4, Eb4, Gb4, Bb4]s", { staff: "bottom" });
  staff.justifyNotes();
}
