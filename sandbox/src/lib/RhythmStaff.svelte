<script lang="ts">
  import RhythmStaff from "@VS/core/RhythmStaff";

  let staff: RhythmStaff | null = $state(null);
  let cursorRect: SVGRectElement | null = null;

  let measureAmount = $state(2);

  function setupStaff(element: HTMLDivElement) {
    staff = new RhythmStaff(element, {
      scale: 1,
      maxMeasures: 2,
      topNumber: 4,
      bottomNumber: 4,
      svgAutoFill: true,
    });

    // 1. Create the SVG rect for the cursor natively
    cursorRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    cursorRect.setAttribute("width", "16");
    cursorRect.setAttribute("height", "80");
    cursorRect.setAttribute("y", "-40"); // Centers it vertically over the staff line
    cursorRect.setAttribute("fill", "rgba(0, 255, 0, 0.39)");

    // 2. Add native CSS transitions directly to the SVG element
    cursorRect.style.transition = "transform 0.1s linear, opacity 0.1s ease";
    cursorRect.style.opacity = "0"; // Hidden by default

    // 3. Append to the exposed uiLayer
    staff.uiLayer.appendChild(cursorRect);
  }

  function createMeasureSixteenths() {
    staff?.drawMeasure([
      { type: "beam", durations: "ssss" },
      { type: "beam", durations: "ssss" },
      { type: "beam", durations: "ssss" },
      { type: "beam", durations: "ssss" },
    ]);
  }

  function createMeasure8ths() {
    staff?.drawMeasure([
      { type: "beam", durations: "eeee" },
      { type: "beam", durations: "eeee" },
    ]);
  }

  function createMeasure1() {
    staff?.drawMeasure([
      { type: "beam", durations: "ee" },
      { type: "rest", duration: "q." },
      { type: "note", duration: "e" },
      { type: "rest", duration: "q" },
    ]);
  }

  function createMeasure2() {
    staff?.drawMeasure([
      { type: "beam", durations: "eeee" },
      { type: "rest", duration: "h" },
    ]);
  }

  let cursorIndex: number = $state(0);
  let cursorDividend: number = $state(4);

  const UI_BEAT_WIDTH = 16;
  const NOTEHEAD_WIDTH = 14;
  const CENTER_OFFSET = Math.floor((NOTEHEAD_WIDTH - UI_BEAT_WIDTH) / 2);

  function updateCursor() {
    if (!staff || !cursorRect) return;

    // Retrieves the local X coordinate relative to the uiLayer
    const localX = staff.getBeatCoordinateX(cursorIndex, cursorDividend);

    if (localX !== -1) {
      cursorRect.style.opacity = "1";
      // Center perfectly over the conceptual notehead
      cursorRect.setAttribute(
        "transform",
        `translate(${localX + CENTER_OFFSET}, 0)`,
      );
    } else {
      cursorRect.style.opacity = "0";
    }
  }

  function advanceBeat() {
    cursorIndex++;
    updateCursor();
  }

  function resetBeat() {
    cursorIndex = 0;
    updateCursor();
  }

  function updateMeasureAmount() {
    staff?.setMaxMeasures(measureAmount);
  }
</script>

<div class="staff-container">
  <div use:setupStaff></div>
</div>

<div class="controls-grid">
  <div class="card">
    <p class="card-title">Measures</p>
    <div class="card-buttons">
      <button class="outlined" onclick={createMeasure1}>Create 1</button>
      <button class="outlined" onclick={createMeasure2}>Create 2</button>
      <button class="outlined" onclick={createMeasure8ths}>Create 8ths</button>
      <button class="primary" onclick={createMeasureSixteenths}
        >Create 16ths</button
      >
    </div>
  </div>

  <div class="card">
    <p class="card-title">Measure Actions</p>
    <div class="card-input-group">
      <label for="measure-amount">Amount</label>
      <input id="measure-amount" bind:value={measureAmount} placeholder="2" />
    </div>
    <div class="card-buttons">
      <button class="primary" onclick={updateMeasureAmount}>Update</button>
    </div>
  </div>

  <div class="card">
    <p class="card-title">Playback UI</p>
    <div class="card-input-group">
      <label for="subdivision">Subdivisions</label>
      <input id="subdivision" bind:value={cursorDividend} placeholder="4" />
    </div>
    <div class="card-buttons">
      <button onclick={resetBeat}>Reset</button>
      <button class="primary" onclick={advanceBeat}>Next Beat</button>
    </div>
  </div>
</div>
