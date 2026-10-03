<script lang="ts">
  import GuitarChords from "@VS/core/GuitarChord";
  import { determineBarreOptions } from "@VS/helpers/guitarHelpers";

  let guitarInstance: GuitarChords | null = $state(null);

  let inputState = $state({
    frets: "xx0232",
    fingers: "000132",
    barres: "",
    startFret: "",
    label: "D",
    removeIndex: 0,
    replaceIndex: 0,
  });

  function setup(element: HTMLDivElement) {
    if (guitarInstance) return;

    guitarInstance = new GuitarChords(element, {
      inlineChordsAmount: 4,
      svgAutoFill: true,
      centerChords: true,
    });

    guitarInstance.addChord("x02220", "001230", {
      label: "A",
    });

    guitarInstance.addChord("x32010", "032010", {
      label: "C",
    });

    guitarInstance.addChord("xx0232", "000132", {
      label: "D",
    });

    // Bbmaj7 Barre Chord (Automatically calculates the starting fret and barre positioning)
    const frets = "687766";
    const fingers = "142311";
    const barres = determineBarreOptions(frets, fingers, [6]);

    guitarInstance.addChord(frets, fingers, {
      label: "Bbmaj7",
      barres: barres,
    });
  }

  function drawChord() {
    let autoBarres = null;
    const fixedStartFret =
      inputState.startFret !== "" ? Number(inputState.startFret) : undefined;

    if (inputState.barres) {
      const barreParts = inputState.barres.split("/").map((e) => Number(e));

      autoBarres = determineBarreOptions(
        inputState.frets,
        inputState.fingers,
        barreParts,
      );
    }

    guitarInstance?.addChord(inputState.frets, inputState.fingers, {
      label: inputState.label ?? undefined,
      barres: autoBarres ?? undefined,
      startFret: fixedStartFret,
    });
  }

  function removeChord() {
    guitarInstance?.removeChordByIndex(inputState.removeIndex);
  }

  function replaceChord() {
    let autoBarres = null;
    const fixedStartFret =
      inputState.startFret !== "" ? Number(inputState.startFret) : undefined;

    if (inputState.barres) {
      const barreParts = inputState.barres.split("/").map((e) => Number(e));

      autoBarres = determineBarreOptions(
        inputState.frets,
        inputState.fingers,
        barreParts,
      );
    }

    guitarInstance?.modifyChordByIndex(
      inputState.frets,
      inputState.fingers,
      inputState.replaceIndex,
      {
        label: inputState.label ?? undefined,
        barres: autoBarres ?? undefined,
        startFret: fixedStartFret,
      },
    );
  }
</script>

<div class="guitar-container">
  <div use:setup></div>
</div>

<div class="controls-grid">
  <div class="card">
    <p class="card-title">Chords</p>

    <div class="card-section">
      <div class="card-input-group">
        <label for="frets">Frets</label>
        <input id="frets" bind:value={inputState.frets} placeholder="xx0123" />
      </div>
      <div class="card-input-group">
        <label for="fingers">Fingers</label>
        <input
          id="fingers"
          bind:value={inputState.fingers}
          placeholder="001123"
        />
      </div>
      <div class="card-input-group">
        <label for="barres">Barres?</label>
        <input id="barres" bind:value={inputState.barres} placeholder="1/3" />
      </div>
      <div class="card-input-group">
        <label for="start-fret">Start fret?</label>
        <input
          id="start-fret"
          bind:value={inputState.startFret}
          placeholder="1/3"
        />
      </div>
      <div class="card-input-group">
        <label for="label">Label</label>
        <input id="label" bind:value={inputState.label} placeholder="Cmaj7" />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={drawChord}>Draw Chord</button>
      </div>

      <div class="card-divider-text">
        <span>OR</span>
      </div>

      <p class="card-section__title">Replace by Index</p>
      <div class="card-input-group">
        <label for="replace-index">Index</label>
        <input
          id="replace-index"
          type="number"
          bind:value={inputState.replaceIndex}
          placeholder="0"
        />
      </div>
      <div class="card-buttons">
        <button onclick={replaceChord}>Replace</button>
      </div>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Actions</p>

    <div class="card-section">
      <p class="card-section__title">Remove Chord</p>
      <div class="card-input-group">
        <label for="index">Index</label>
        <input
          id="index"
          type="number"
          bind:value={inputState.removeIndex}
          placeholder="0"
        />
      </div>
      <div class="card-buttons">
        <button class="primary" onclick={removeChord}>Remove</button>
      </div>
    </div>
  </div>
</div>

<style>
  :global {
    .vs-guitar-chord {
      font-family: "Inter";
      color: var(--color-on-surface);
    }

    .vs-guitar-fret-text {
      color: var(--color-on-surface-inverse);
      font-size: 14px;
    }
  }

  .guitar-container {
    display: grid;
    place-items: center;
    background-color: var(--color-surface);
    padding: var(--space-8);
    border-bottom: 1px solid var(--color-border);

    max-height: 16em;
    overflow-y: auto;
  }
</style>
