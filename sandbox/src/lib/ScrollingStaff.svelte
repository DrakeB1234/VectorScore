<script lang="ts">
  import ScrollingStaff from "@VS/core/ScrollingStaff";
  import {
    beamConfig,
    chordConfig,
    noteConfig,
    restConfig,
  } from "@VS/helpers/noteHelpers";

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

    const beam = beamConfig([
      noteConfig("C4e"),
      noteConfig("E4e"),
      noteConfig("F4e"),
    ]);

    const chord = chordConfig(["D4", "F#4", "A4"], "q", "marcato");

    staff.queueNotes([
      noteConfig("C4q."),
      restConfig("s"),
      beam,
      chord,
      noteConfig("D4q"),
      restConfig("q"),
      noteConfig("E4q"),
      noteConfig("F4q"),
      beam,
      restConfig("t"),
      noteConfig("G4q"),
      noteConfig("A4q"),
      chord,
      noteConfig("B4q"),
      noteConfig("D4q"),
      noteConfig("E4q"),
    ]);
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
