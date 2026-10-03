<script lang="ts">
  import MusicStaff from "@VS/core/StandardStaff";
  import { chordConfig, noteConfig, restConfig } from "@VS/helpers/noteHelpers";
  import type { SystemTypes } from "@VS/types";
  import BeamCard from "./BeamCard.svelte";
  // @ts-ignore
  import DrawingCard from "./DrawingCard.svelte";
  // @ts-ignore
  import ErrorUICard from "./ErrorUICard.svelte";
  // @ts-ignore
  import SignatureCard from "./SignatureCard.svelte";

  let staff: MusicStaff | null = $state(null);
  let staffMap: Record<string, MusicStaff> = $state({});
  let currentStaffType: SystemTypes = $state("grand");

  let inputState = $state({
    removeIndex: 0,
  });

  function setupStaff(element: HTMLDivElement, staffType: SystemTypes) {
    staffMap[staffType] = new MusicStaff(element, {
      width: 400,
      scale: 1,
      staffType: staffType,
      paddingTop: 40,
      paddingBottom: 40,
      // keySignature: "G",
      timeSignature: {
        topNumber: 4,
        bottomNumber: 4,
      },
    });

    if (staffType === "grand") {
      staff = staffMap["grand"];

      staff.drawBatchElements([
        { config: noteConfig("C4w") },
        { config: noteConfig("D4h") },
        { config: noteConfig("E4q") },
        { config: noteConfig("F4e") },
        { config: noteConfig("G4s") },
        { config: chordConfig(["F5", "A5", "C6"], "q") },
      ]);
    }
  }

  function handleStaffSelect(e: Event) {
    const target = e.target as HTMLSelectElement;

    staff = staffMap[target.value];
    currentStaffType = target.value as SystemTypes;
  }

  function clearAllNotes() {
    staff?.clearAllNotes();
  }

  function justifyNotes() {
    staff?.justifyNotes();
  }

  function drawBarline() {
    staff?.drawBarline();
  }

  function removeElement() {
    if (!staff) return;
    staff.removeElementByIndex(inputState.removeIndex);
  }
</script>

<div class="staff-container">
  <div use:setupStaff={"grand"} class:hide={currentStaffType !== "grand"}></div>
  <div
    use:setupStaff={"treble"}
    class:hide={currentStaffType !== "treble"}
  ></div>
  <div use:setupStaff={"bass"} class:hide={currentStaffType !== "bass"}></div>
  <div use:setupStaff={"alto"} class:hide={currentStaffType !== "alto"}></div>
</div>

<div class="controls-grid">
  <div class="card">
    <p class="card-title">Staffs</p>

    <div class="card-section">
      <div class="card-input-group">
        <label for="choose-staff">Staff</label>
        <select id="choose-staff" onchange={handleStaffSelect}>
          <option value="grand">Grand Staff</option>
          <option value="treble">Treble Clef</option>
          <option value="bass">Bass Clef</option>
          <option value="alto">Alto Clef</option>
        </select>
      </div>
    </div>

    <div class="card-section">
      <div class="card-buttons">
        <button onclick={clearAllNotes}>Clear All Notes</button>
        <button onclick={justifyNotes}>Justify Notes</button>
        <button onclick={drawBarline}>Draw barline</button>
      </div>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Remove Note</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="remove-index">Index</label>
        <input
          id="remove-index"
          type="number"
          bind:value={inputState.removeIndex}
          placeholder="0"
        />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={removeElement}>Remove</button>
      </div>
    </div>
  </div>

  <SignatureCard bind:musicStaffInstance={staff} />

  <BeamCard bind:musicStaffInstance={staff} />

  <ErrorUICard bind:musicStaffInstance={staff} />

  <DrawingCard bind:musicStaffInstance={staff} />
</div>

<style>
  :global {
    .vs-staff-layer,
    .vs-notes-layer {
      color: var(--color-on-surface);
    }

    .wrong-note {
      color: red;
    }

    .correct-note {
      color: rgb(0, 179, 15);
    }
  }

  .hide {
    display: none;
  }
</style>
