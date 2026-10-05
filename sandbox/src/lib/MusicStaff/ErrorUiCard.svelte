<script lang="ts">
  import type MusicStaff from "@VS/core/StandardStaff";

  type Props = {
    musicStaffInstance: MusicStaff | null;
  };

  let { musicStaffInstance = $bindable() }: Props = $props();

  const SVG_NS = "http://www.w3.org/2000/svg";
  const DISPLAY_MS = 1000;
  const HEAD_PATH =
    "M7 18c-3.9 0-7-2.2-7-6C0 5.8 6.3 0 14.3 0c4 0 7 2.3 7 6 0 6.1-8 12-14.3 12";
  const HEAD_X_OFFSET = -10; // Centers the head on the entry's x
  const HEAD_Y_OFFSET = -9; // Centers the head on the pitch's y

  let uiIndex: number | null = $state(0);
  let uiNote = $state("");

  // Each staff gets its own marker group on its uiLayer, created the first time it's needed
  const markerGroups = new WeakMap<MusicStaff, SVGGElement>();
  let activeGroup: SVGGElement | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  function getMarkerGroup(staff: MusicStaff) {
    let group = markerGroups.get(staff);

    if (!group) {
      group = document.createElementNS(SVG_NS, "g");
      group.classList.add("ui-error-note", "hide");
      staff.uiLayer.appendChild(group);
      markerGroups.set(staff, group);
    }

    return group;
  }

  function createErrorHead(yPos: number) {
    const wrapper = document.createElementNS(SVG_NS, "g");
    wrapper.setAttribute(
      "transform",
      `translate(${HEAD_X_OFFSET}, ${yPos + HEAD_Y_OFFSET})`,
    );

    const head = document.createElementNS(SVG_NS, "path");
    head.setAttribute("d", HEAD_PATH);
    head.setAttribute("fill", "#FF0000AA");

    wrapper.appendChild(head);
    return wrapper;
  }

  function clearErrorNote() {
    if (hideTimeout !== null) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    activeGroup?.classList.add("hide");
    activeGroup = null;
  }

  function showErrorNote() {
    clearErrorNote(); // Also restarts the flash if one is already showing

    const staff = musicStaffInstance;
    if (!staff || uiIndex === null || uiIndex < 0) return;

    // Everything that can throw (bad index / bad pitch) runs before the DOM is touched
    const { x, y, isTopStaff } = staff.getDataFromEntryIndex(uiIndex);
    const pitches = uiNote
      .split("/")
      .map((p) => p.trim())
      .filter(Boolean);

    // No pitches typed: mark the entry's own position. Otherwise, mark each pitch on the entry's staff.
    const yPositions =
      pitches.length > 0 ? staff.getYFromPitches(pitches, isTopStaff) : [y];

    const group = getMarkerGroup(staff);
    group.setAttribute("transform", `translate(${x}, 0)`);
    group.replaceChildren(...yPositions.map((yPos) => createErrorHead(yPos)));
    group.classList.remove("hide");

    activeGroup = group;
    hideTimeout = setTimeout(clearErrorNote, DISPLAY_MS);
  }

  // Cleanup runs when the staff changes (so a marker doesn't linger on the old one) and on unmount
  $effect(() => {
    void musicStaffInstance;

    return clearErrorNote;
  });
</script>

<div class="card">
  <p class="card-title">Error UI Actions</p>
  <div class="card-section">
    <div class="card-input-group">
      <label for="ui-index">Index</label>
      <input id="ui-index" type="number" bind:value={uiIndex} placeholder="0" />
    </div>
    <div class="card-input-group">
      <label for="ui-note">Note</label>
      <input id="ui-note" bind:value={uiNote} placeholder="C4" />
    </div>
    <div class="card-buttons">
      <button onclick={clearErrorNote}>Clear</button>
      <button class="primary" onclick={showErrorNote}>Set</button>
    </div>
  </div>
</div>

<style>
  /* The marker group is created with classList, so Svelte can't see the classes. They need to be global. */
  :global {
    .ui-error-note {
      opacity: 1;

      transition: opacity 0.3s ease-in-out;
    }

    .ui-error-note path {
      animation: headShake 0.7s ease-in 1 forwards;
    }

    .ui-error-note.hide {
      opacity: 0;
    }

    @keyframes headShake {
      0% {
        transform: translateX(0);
      }

      6.5% {
        transform: translateX(-6px) rotateY(-9deg);
      }

      18.5% {
        transform: translateX(5px) rotateY(7deg);
      }

      31.5% {
        transform: translateX(-3px) rotateY(-5deg);
      }

      43.5% {
        transform: translateX(2px) rotateY(3deg);
      }

      50% {
        transform: translateX(0);
      }
    }
  }

  .card {
    max-width: 600px;
    margin: var(--space-8) auto;
  }
</style>
