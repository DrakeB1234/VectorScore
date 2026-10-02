<script lang="ts">
  import type { DrawOptions } from "@VS/core/MusicStaff";
  import { chordConfig, noteConfig, restConfig } from "@VS/helpers/noteHelpers";

  let { musicStaffInstance = $bindable() } = $props();

  let inputState = $state({
    isTop: true,
    replaceIndex: 0,
    noteValue: "C4q",
    chordValue: "C4/E4/G4",
    chordDuration: "q",
    restValue: "q",
    drawClasses: "",
  });

  type DrawType = "note" | "chord" | "rest";
  let currentDrawType: DrawType = $state("note");

  let currentDrawOptions: DrawOptions = $derived({
    staff: inputState.isTop ? "top" : "bottom",
    classes: parseDrawClasses(inputState.drawClasses),
  });

  function parseDrawClasses(classesString: string) {
    if (classesString === "") return undefined;

    return classesString.split("/");
  }

  function drawNote() {
    musicStaffInstance?.drawNote(inputState.noteValue, currentDrawOptions);
  }

  function drawChord() {
    const noteParts = inputState.chordValue.split("/");

    musicStaffInstance?.drawChord(
      noteParts,
      inputState.chordDuration as any,
      currentDrawOptions,
    );
  }

  function drawRest() {
    musicStaffInstance?.drawRest(inputState.restValue, currentDrawOptions);
  }

  function replaceByIndex(type: DrawType) {
    const index = inputState.replaceIndex;

    if (type === "note") {
      musicStaffInstance?.replaceByIndex(
        index,
        noteConfig(inputState.noteValue),
        currentDrawOptions,
      );
    }
    if (type === "chord") {
      const noteParts = inputState.chordValue.split("/");

      musicStaffInstance?.replaceByIndex(
        index,
        chordConfig(noteParts, inputState.chordDuration),
        currentDrawOptions,
      );
    }
    if (type === "rest") {
      musicStaffInstance?.replaceByIndex(
        index,
        restConfig(inputState.restValue),
        currentDrawOptions,
      );
    }
  }
</script>

<div class="card">
  <p class="card-title">Drawing</p>

  <div class="card-section">
    <div class="card-input-group">
      <label for="draw-type">Type</label>
      <select id="draw-type" bind:value={currentDrawType}>
        <option value="note">Note</option>
        <option value="chord">Chord</option>
        <option value="rest">Rest</option>
      </select>
    </div>

    <label class="checkbox-group">
      Draw on top staff?
      <input type="checkbox" bind:checked={inputState.isTop} />
    </label>

    <div class="card-input-group space-above-base">
      <label for="draw-classes">Classes?</label>
      <input
        id="draw-classes"
        bind:value={inputState.drawClasses}
        placeholder="class/class..."
      />
    </div>
  </div>

  {#if currentDrawType === "note"}
    <div class="card-section">
      <p class="card-section__title">Draw Note</p>
      <div class="card-input-group">
        <label for="draw-note-note">Note</label>
        <input
          id="draw-note-note"
          bind:value={inputState.noteValue}
          placeholder="C4q"
        />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawNote}>Draw Note</button>
      </div>

      <div class="card-divider-text">
        <span>OR</span>
      </div>

      <p class="card-section__title">Replace by index</p>
      <div class="card-input-group">
        <label for="replace-index">Index</label>
        <input
          id="replace-index"
          type="number"
          bind:value={inputState.replaceIndex}
          min="0"
        />
      </div>
      <div class="card-buttons">
        <button onclick={() => replaceByIndex("note")}>Replace</button>
      </div>
    </div>
  {:else if currentDrawType === "chord"}
    <div class="card-section">
      <p class="card-section__title">Draw Chord</p>
      <div class="card-input-group">
        <label for="draw-chord">Chord</label>
        <input
          id="draw-chord"
          bind:value={inputState.chordValue}
          placeholder="C4/E4/G4"
        />
      </div>
      <div class="card-input-group">
        <label for="draw-chord-duration">Duration</label>
        <input
          id="draw-chord-duration"
          bind:value={inputState.chordDuration}
          placeholder="q"
        />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawChord}>Draw Chord</button>
      </div>

      <div class="card-divider-text">
        <span>OR</span>
      </div>

      <p class="card-section__title">Replace by index</p>
      <div class="card-input-group">
        <label for="replace-chord-index">Index</label>
        <input
          id="replace-chord-index"
          type="number"
          bind:value={inputState.replaceIndex}
          min="0"
        />
      </div>
      <div class="card-buttons">
        <button onclick={() => replaceByIndex("chord")}>Replace</button>
      </div>
    </div>
  {:else if currentDrawType === "rest"}
    <div class="card-section">
      <p class="card-section__title">Draw Rest</p>
      <div class="card-input-group">
        <label for="draw-rest">Rest</label>
        <input
          id="draw-rest"
          bind:value={inputState.restValue}
          placeholder="q"
        />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawRest}>Draw Rest</button>
      </div>

      <div class="card-divider-text">
        <span>OR</span>
      </div>

      <p class="card-section__title">Replace by index</p>
      <div class="card-input-group">
        <label for="replace-rest-index">Index</label>
        <input
          id="replace-rest-index"
          type="number"
          bind:value={inputState.replaceIndex}
          min="0"
        />
      </div>
      <div class="card-buttons">
        <button onclick={() => replaceByIndex("rest")}>Replace</button>
      </div>
    </div>
  {/if}
</div>
