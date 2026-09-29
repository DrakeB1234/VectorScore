<script lang="ts">
  import MusicStaff, { type DrawOptions } from "../../../src/core/MusicStaff";
  import {
    chordConfig,
    noteConfig,
    restConfig,
  } from "../../../src/helpers/noteHelpers";
  import type { SystemTypes } from "../../../src/types";
  import DrawingCard from "./DrawingCard.svelte";

  let staff: MusicStaff | null = $state(null);
  let staffMap: Record<string, MusicStaff> = $state({});
  let currentStaffType: SystemTypes = $state("grand");

  // Inputs
  type DrawType = "note" | "chord" | "rest";

  let currentDrawType: DrawType = $state("note");

  let inputState = $state({
    isTop: true,
    replaceIndex: 0,
    noteValue: "C4q",
    chordValue: "C4/E4/G4",
    chordDuration: "q",
    restValue: "q",
    keySig: "",
    timeSig: "",
  });

  let currentDrawOptions: DrawOptions = $derived({
    staff: inputState.isTop ? "top" : "bottom",
  });

  function setupStaff(element: HTMLDivElement, staffType: SystemTypes) {
    staffMap[staffType] = new MusicStaff(element, {
      width: 400,
      staffType: staffType,
      paddingTop: 40,
      paddingBottom: 40,
      keySignature: "G",
      timeSignature: {
        topNumber: 4,
        bottomNumber: 4,
      },
    });

    if (staffType === "grand") {
      staffMap[staffType].drawNote("C4q");
      staff = staffMap[staffType];
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

  function drawNote() {
    staff?.drawNote(inputState.noteValue, currentDrawOptions);
  }

  function drawChord() {
    const noteParts = inputState.chordValue.split("/");

    staff?.drawChord(
      noteParts,
      inputState.chordDuration as any,
      currentDrawOptions,
    );
  }

  function drawRest() {
    staff?.drawRest(inputState.restValue, currentDrawOptions);
  }

  function replaceByIndex(type: DrawType) {
    const index = inputState.replaceIndex;

    if (type === "note") {
      staff?.replaceByIndex(
        index,
        noteConfig(inputState.noteValue),
        currentDrawOptions,
      );
    }
    if (type === "chord") {
      const noteParts = inputState.chordValue.split("/");

      staff?.replaceByIndex(
        index,
        chordConfig(noteParts, inputState.chordDuration),
        currentDrawOptions,
      );
    }
    if (type === "rest") {
      staff?.replaceByIndex(
        index,
        restConfig(inputState.restValue),
        currentDrawOptions,
      );
    }
  }

  function changeKeySig(isRemove: boolean = false) {
    const value = inputState.keySig;

    if (isRemove || value === "") {
      staff?.removeKeySignature();
      return;
    }

    staff?.changeKeySignature(value as any);
  }

  function changeTimeSig(isRemove: boolean = false) {
    const valueParts = inputState.timeSig.split("/").map((e) => Number(e));

    if (isRemove || !valueParts) {
      staff?.removeTimeSignature();
      return;
    }

    staff?.changeTimeSignature(valueParts[0], valueParts[1]);
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
        <label for="choose-staff">Choose Staff</label>
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
      </div>
    </div>
  </div>

  <DrawingCard
    bind:currentDrawType
    bind:inputState
    handleDrawNote={drawNote}
    handleDrawChord={drawChord}
    handleDrawRest={drawRest}
    handleReplaceByIndex={replaceByIndex}
  />

  <div class="card">
    <p class="card-title">Staff Signatures</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="key-sig">Key signature</label>
        <input id="key-sig" bind:value={inputState.keySig} placeholder="Bb" />
      </div>
      <div class="card-buttons">
        <button onclick={() => changeKeySig(true)}>Remove</button>
        <button class="primary" onclick={() => changeKeySig()}>Draw</button>
      </div>
    </div>

    <div class="card-section">
      <div class="card-input-group">
        <label for="time-sig">Time signature</label>
        <input
          id="time-sig"
          bind:value={inputState.timeSig}
          placeholder="4/4"
        />
      </div>
      <div class="card-buttons">
        <button onclick={() => changeTimeSig(true)}>Remove</button>
        <button class="primary" onclick={() => changeTimeSig()}>Draw</button>
      </div>
    </div>
  </div>
</div>

<style>
  :global {
    .vs-staff-layer,
    .vs-notes-layer {
      color: var(--color-on-surface);
    }
  }

  .hide {
    display: none;
  }

  .staff-container {
    position: sticky;
    top: 0;

    display: grid;
    place-items: center;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .controls-grid {
    padding: var(--space-16);
  }
</style>
