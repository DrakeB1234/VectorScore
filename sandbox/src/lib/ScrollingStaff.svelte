<script lang="ts">
  import ScrollingStaff from "@VS/core/ScrollingStaff";
  import {
    beamConfig,
    chordConfig,
    noteConfig,
    restConfig,
  } from "@VS/helpers/inputHelpers";

  let staff: ScrollingStaff | null = $state(null);

  let isNotesOut = $state(false);

  function setupStaff(element: HTMLDivElement) {
    staff = new ScrollingStaff(element, {
      width: 400,
      scale: 1,
      staffType: "grand",
      paddingTop: 40,
      paddingBottom: 40,
      keySignature: "D",
      // timeSignature: {
      //   topNumber: 4,
      //   bottomNumber: 4,
      // },
      onNotesOut: () => {
        isNotesOut = true;
      },
    });

    fillNotes();
  }

  function advanceNote() {
    staff?.advanceNotes();
  }

  function fillNotes() {
    if (!staff) return;

    isNotesOut = false;

    const note = noteConfig({ letter: "B", octave: 4, duration: "q" });
    const chord = chordConfig({
      notes: [
        { letter: "B", octave: 4 },
        { letter: "D", octave: 4 },
      ],
      duration: "q",
      articulation: "accent",
    });
    const rest = restConfig({ duration: "q" });

    staff.queueNotes([note, chord, note, chord, rest]);
  }
</script>

<div class="staff-container">
  <div use:setupStaff></div>

  {#if isNotesOut}
    <p>Notes out!</p>
  {/if}
</div>

<div class="controls-grid">
  <div class="card">
    <p class="card-title">Actions</p>

    <div class="card-section">
      <div class="card-buttons">
        <button onclick={fillNotes}>Fill Notes</button>
        <button onclick={advanceNote}>Advance Notes</button>
      </div>
    </div>
  </div>
</div>

<style>
  :global {
    .vs-scrolling-notes-layer > g {
      transition: transform 0.15s ease-in;
    }
  }
</style>
