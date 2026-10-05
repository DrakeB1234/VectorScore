<script lang="ts">
  import StandardStaff from "@VS/core/StandardStaff";
  import {
    chordConfig,
    noteConfig,
    restConfig,
  } from "@VS/helpers/inputHelpers";

  let staff: StandardStaff | null = $state(null);

  function setupStaff(element: HTMLDivElement) {
    staff = new StandardStaff(element, {
      width: 600,
      scale: 1,
      staffType: "grand",
      paddingTop: 50,
      paddingBottom: 20,
      keySignature: "G",
      timeSignature: {
        topNumber: 9,
        bottomNumber: 8,
      },
    });

    // staff.drawBatchElements(
    //   "|: C4w | B#4q.(staccato) [B4,D5,F5]q(fermata) rt rq. :| C4e(staccato)-[E4,G4,A5]e(tenuto)-G4s(staccato)",
    // );

    staff.drawNote("C4w");
    staff.drawNote(noteConfig({ letter: "C", octave: 4, duration: "w" }));

    staff.drawRest("Rq.");
    staff.drawRest(restConfig({ duration: "q", isDotted: true }));

    staff.drawChord("[C4,E#4,G4]h(accent)");
    staff.drawChord(
      chordConfig({
        notes: [
          { letter: "C", octave: 4 },
          { letter: "E", octave: 4, accidental: "#" },
          { letter: "G", octave: 4 },
        ],
        duration: "h",
        articulation: "accent",
      }),
    );

    staff.drawBeam("C4s-E#4s(tenuto)-G4e-F5e");

    staff.drawBarline("|]");
  }
</script>

<div class="staff-container">
  <div use:setupStaff></div>
</div>
