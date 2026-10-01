<script lang="ts">
  import RhythmStaff from "@VS/core/RhythmStaff";

  let staff: RhythmStaff | null = $state(null);

  let noteValue = $state("");
  let restValue = $state("");
  let beamValue = $state("");

  let cursorIndex: number | null = $state(null);

  function setupStaff(element: HTMLDivElement) {
    staff = new RhythmStaff(element, {
      width: 400,
      scale: 1,
      maxMeasures: 2,
      padding: 40,
      topNumber: 4,
      bottomNumber: 4,
      svgAutoFill: true,
    });
  }

  function drawNote() {
    staff?.drawRyhthmNote(noteValue);
  }

  function drawRest() {
    staff?.drawRest(restValue);
  }

  function drawBeam() {
    staff?.drawBeam(beamValue);
  }

  function createMeasure() {
    staff?.drawMeasure([
      { type: "beam", durations: "ee" },
      { type: "rest", duration: "q" },
      { type: "note", duration: "q" },
      { type: "beam", durations: "ee" },
    ]);
  }
</script>

<div class="staff-container">
  <div use:setupStaff></div>
</div>

<div class="controls-grid">
  <div class="card">
    <p class="card-title">Actions</p>
    <div class="card-buttons">
      <button class="primary" onclick={createMeasure}>Create Measure</button>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Notes</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="note-duration">Duration</label>
        <input id="note-duration" bind:value={noteValue} placeholder="q." />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawNote}>Draw</button>
      </div>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Rests</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="rest-duration">Duration</label>
        <input id="rest-duration" bind:value={restValue} placeholder="q." />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawRest}>Draw</button>
      </div>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Beams</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="beam">Value</label>
        <input id="beam" bind:value={beamValue} placeholder="eeee" />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawBeam}>Draw</button>
      </div>
    </div>
  </div>
</div>

<style>
  :global {
    .vs-ui-beat {
      color: rgba(0, 255, 0, 0.39);
    }
  }
</style>
