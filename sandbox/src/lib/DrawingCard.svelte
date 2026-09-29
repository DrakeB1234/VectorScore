<script>
  let {
    currentDrawType = $bindable(),
    inputState = $bindable(),
    handleDrawNote,
    handleDrawRest,
    handleDrawChord,
    handleReplaceByIndex,
  } = $props();
</script>

<div class="card">
  <p class="card-title">Drawing</p>

  <div class="card-section">
    <div class="card-input-group">
      <label for="draw-type">Choose Type</label>
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
        <button class="primary" onclick={handleDrawNote}>Draw Note</button>
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
        <button onclick={() => handleReplaceByIndex("note")}>Replace</button>
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
        <button class="primary" onclick={handleDrawChord}>Draw Chord</button>
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
        <button onclick={() => handleReplaceByIndex("chord")}>Replace</button>
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
        <button class="primary" onclick={handleDrawRest}>Draw Rest</button>
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
        <button onclick={() => handleReplaceByIndex("rest")}>Replace</button>
      </div>
    </div>
  {/if}
</div>
