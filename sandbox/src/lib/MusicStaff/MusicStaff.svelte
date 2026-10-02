<script lang="ts">
  import MusicStaff, { type DrawOptions } from "@VS/core/MusicStaff";
  import {
    beamConfig,
    chordConfig,
    noteConfig,
    restConfig,
  } from "@VS/helpers/noteHelpers";
  import type { SystemTypes } from "@VS/types";
  import BeamCard from "./BeamCard.svelte";
  import DrawingCard from "./DrawingCard.svelte";
  import { STAFF_LINE_COUNT } from "@VS/helpers/staffHelpers";

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
    drawClasses: "",
    keySig: "",
    timeSig: "",
    uiIndex: 0,
    uiNote: "",
    removeIndex: 0,
  });

  function parseDrawClasses(classesString: string) {
    if (classesString === "") return undefined;

    return classesString.split("/");
  }

  let currentDrawOptions: DrawOptions = $derived({
    staff: inputState.isTop ? "top" : "bottom",
    classes: parseDrawClasses(inputState.drawClasses),
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
        { config: noteConfig("C4q"), options: currentDrawOptions },
        { config: noteConfig("D4q"), options: currentDrawOptions },
        { config: noteConfig("E4q"), options: currentDrawOptions },
        { config: noteConfig("F4q"), options: currentDrawOptions },
        { config: { type: "barline" }, options: currentDrawOptions },
        { config: noteConfig("G4q"), options: currentDrawOptions },
        { config: noteConfig("A4q"), options: currentDrawOptions },
        { config: noteConfig("B4q"), options: currentDrawOptions },
      ]);

      // Create the UI group element to hold noteheads
      uiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      uiGroup.classList.add("ui-error-note", "hide");
      staff.uiLayer.appendChild(uiGroup);
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

  function drawBarline() {
    staff?.drawBarline();
  }

  // UI Helpers

  let uiGroup: SVGGElement;
  let uiHeads: SVGPathElement[] = [];
  let uiInterval: ReturnType<typeof setInterval> | null = null;

  const uiHeadXOffset = -10;
  const uiHeadYOffset = -9;

  function setErrorNoteToIndex() {
    if (!staff) return;

    if (
      currentStaffType !== "grand" ||
      inputState.uiIndex === -1 ||
      uiInterval !== null
    )
      clearErrorNote();

    uiGroup.classList.remove("hide");

    const { x, y } = staff.getCoordsFromEntryIndex(inputState.uiIndex);
    let finalY = [y]; // Defaults to a single position from coords method
    let finalX = x;

    if (inputState.uiNote !== "") {
      const noteParts = inputState.uiNote.split("/");

      // Considers isTopStaff, which affects the vertical positioning of the note for grand staff.
      finalY = staff.getYFromPitches(noteParts, currentDrawOptions);
    }

    finalY.forEach((yPos) => {
      const ele = createErrorHead();
      ele.setAttribute(
        "transform",
        `translate(${uiHeadXOffset}, ${yPos + uiHeadYOffset})`,
      );
      uiHeads.push(ele);
    });

    uiGroup.setAttribute("transform", `translate(${finalX}, 0)`);
    uiGroup.replaceChildren(...uiHeads);

    uiInterval = setInterval(() => {
      clearErrorNote();
    }, 1000);
  }

  function createErrorHead() {
    // Create the UI element for wrong notes
    let uiElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    uiElement.setAttribute(
      "d",
      "M7 18c-3.9 0-7-2.2-7-6C0 5.8 6.3 0 14.3 0c4 0 7 2.3 7 6 0 6.1-8 12-14.3 12",
    );
    uiElement.setAttribute("fill", "#FF000077");

    return uiElement;
  }

  function clearErrorNote() {
    if (uiInterval) {
      clearInterval(uiInterval);
      uiInterval = null;
    }
    uiHeads = [];
    uiGroup.classList.add("hide");
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
    <p class="card-title">Staff Signatures</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="key-sig">Key</label>
        <input id="key-sig" bind:value={inputState.keySig} placeholder="Bb" />
      </div>
      <div class="card-buttons">
        <button onclick={() => changeKeySig(true)}>Remove</button>
        <button class="primary" onclick={() => changeKeySig()}>Draw</button>
      </div>
    </div>

    <div class="card-section">
      <div class="card-input-group">
        <label for="time-sig">Time</label>
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

  <DrawingCard
    bind:currentDrawType
    bind:inputState
    handleDrawNote={drawNote}
    handleDrawChord={drawChord}
    handleDrawRest={drawRest}
    handleReplaceByIndex={replaceByIndex}
  />

  <BeamCard bind:musicStaffInstance={staff} />

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

  <div class="card">
    <p class="card-title">Error UI Actions</p>
    <div class="card-section">
      <div class="card-input-group">
        <label for="ui-index">Index</label>
        <input
          id="ui-index"
          type="number"
          bind:value={inputState.uiIndex}
          placeholder="0"
        />
      </div>
      <div class="card-input-group">
        <label for="ui-note">Note</label>
        <input id="ui-note" bind:value={inputState.uiNote} placeholder="C4" />
      </div>
      <div class="card-buttons">
        <button onclick={clearErrorNote}>Clear</button>
        <button class="primary" onclick={setErrorNoteToIndex}>Set</button>
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

    .ui-error-note {
      opacity: 1;

      transition: opacity 0.3s ease;
    }

    .ui-error-note.hide {
      opacity: 0;
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
