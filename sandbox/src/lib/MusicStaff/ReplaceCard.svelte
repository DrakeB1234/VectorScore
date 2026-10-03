<script lang="ts">
  import StandardStaff, {
    type StandardStaffDrawOptions,
  } from "@VS/core/StandardStaff";
  import {
    chordConfig,
    noteConfig,
    restConfig,
    shiftPitches,
  } from "@VS/helpers/noteHelpers";

  type Props = {
    staffInstance: StandardStaff | null;
  };

  let { staffInstance = $bindable() }: Props = $props();

  type DrawType = "note" | "chord" | "rest";
  let currentDrawType: DrawType = $state("note");

  let inputState = $state({
    targetIndex: 0,
    isTop: true,
    noteValue: "C4q",
    chordValue: "C4/E4/G4",
    chordDuration: "q",
    restValue: "q",
    drawClasses: "",
    articulation: "",
  });

  let currentDrawOptions: StandardStaffDrawOptions = $derived({
    staff: inputState.isTop ? "top" : "bottom",
    classes: inputState.drawClasses
      ? inputState.drawClasses.split("/")
      : undefined,
    articulation: inputState.articulation
      ? (inputState.articulation as any)
      : undefined,
  });

  function handleReplace() {
    if (!staffInstance) return;

    if (currentDrawType === "note") {
      staffInstance.replaceByIndex(
        inputState.targetIndex,
        noteConfig(inputState.noteValue, currentDrawOptions.articulation),
        currentDrawOptions,
      );
    } else if (currentDrawType === "chord") {
      const noteParts = inputState.chordValue.split("/");
      staffInstance.replaceByIndex(
        inputState.targetIndex,
        chordConfig(
          noteParts,
          inputState.chordDuration as any,
          currentDrawOptions.articulation,
        ),
        currentDrawOptions,
      );
    } else if (currentDrawType === "rest") {
      staffInstance.replaceByIndex(
        inputState.targetIndex,
        restConfig(inputState.restValue),
        currentDrawOptions,
      );
    }
  }

  function nudgeNote(steps: number) {
    if (!inputState.noteValue) return;
    try {
      // Split the pitch (e.g., C4, Eb5) from the duration (e.g., q, s.)
      const match = inputState.noteValue.match(
        /^([a-zA-Z](?:##|bb|[#bn])?\d)(.*)$/,
      );
      if (match) {
        const shifted = shiftPitches([match[1]], steps);
        inputState.noteValue = shifted[0] + match[2];
      }
    } catch (e) {
      // Catch parse errors if the user is mid-typing
    }
  }

  function nudgeChord(steps: number) {
    if (!inputState.chordValue) return;
    try {
      const pitches = inputState.chordValue.split("/");
      const shifted = shiftPitches(pitches, steps);
      inputState.chordValue = shifted.join("/");
    } catch (e) {
      // Catch parse errors if the user is mid-typing
    }
  }
</script>

<div class="card">
  <!-- Segmented Control for Type -->
  <div class="segmented-control">
    <button
      class="toggle"
      class:active={currentDrawType === "note"}
      onclick={() => (currentDrawType = "note")}>Note</button
    >
    <button
      class="toggle"
      class:active={currentDrawType === "chord"}
      onclick={() => (currentDrawType = "chord")}>Chord</button
    >
    <button
      class="toggle"
      class:active={currentDrawType === "rest"}
      onclick={() => (currentDrawType = "rest")}>Rest</button
    >
  </div>

  <!-- Shared Options -->
  <div class="input-grid">
    <div class="input-group">
      <label>Target Index</label>
      <input type="number" bind:value={inputState.targetIndex} min="0" />
    </div>

    <div class="input-group">
      <label>Classes</label>
      <input bind:value={inputState.drawClasses} placeholder="class1/class2" />
    </div>

    <label class="checkbox-group" style="grid-column: 1 / -1;">
      <input type="checkbox" bind:checked={inputState.isTop} /> Draw on top staff
    </label>
  </div>

  <hr class="divider" />

  <!-- Dynamic Inputs based on Type -->
  <div class="input-grid">
    {#if currentDrawType === "note"}
      <div class="input-group">
        <label>Pitch & Duration</label>
        <div class="nudge-wrap">
          <input bind:value={inputState.noteValue} placeholder="C4q" />
          <button
            class="nudge-btn"
            onclick={() => nudgeNote(1)}
            title="Shift Up">↑</button
          >
          <button
            class="nudge-btn"
            onclick={() => nudgeNote(-1)}
            title="Shift Down">↓</button
          >
        </div>
      </div>
    {:else if currentDrawType === "chord"}
      <div class="input-group">
        <label>Pitches</label>
        <div class="nudge-wrap">
          <input bind:value={inputState.chordValue} placeholder="C4/E4/G4" />
          <button
            class="nudge-btn"
            onclick={() => nudgeChord(1)}
            title="Shift Up">↑</button
          >
          <button
            class="nudge-btn"
            onclick={() => nudgeChord(-1)}
            title="Shift Down">↓</button
          >
        </div>
      </div>
      <div class="input-group">
        <label>Duration</label>
        <input bind:value={inputState.chordDuration} placeholder="q" />
      </div>
    {:else if currentDrawType === "rest"}
      <div class="input-group">
        <label>Duration</label>
        <input bind:value={inputState.restValue} placeholder="q" />
      </div>
    {/if}

    <!-- Rests don't get articulations -->
    {#if currentDrawType !== "rest"}
      <div class="input-group">
        <label>Articulation</label>
        <input
          bind:value={inputState.articulation}
          placeholder="staccato, accent..."
        />
      </div>
    {/if}
  </div>

  <div class="card-buttons">
    <button class="primary full-width" onclick={handleReplace}
      >Replace at Index {inputState.targetIndex}</button
    >
  </div>
</div>

<style>
  .card {
    max-width: 600px;
    margin: var(--space-8) auto;
  }

  .segmented-control {
    display: flex;
    gap: var(--space-8);
    margin-bottom: var(--space-24);
  }

  .toggle {
    min-width: 80px;
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16);
    align-items: center;
    margin-bottom: var(--space-16);
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nudge-wrap {
    display: flex;
    gap: 0.25rem;
  }

  .nudge-wrap input {
    flex: 1;
    min-width: 0;
  }

  .nudge-btn {
    padding: 0 0.5rem;
    cursor: pointer;
  }

  .divider {
    margin: var(--space-24) 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  .card-buttons {
    margin-top: var(--space-16);
  }

  .full-width {
    width: 100%;
  }
</style>
