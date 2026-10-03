<script lang="ts">
  import MusicStaff from "@VS/core/StandardStaff";
  import type { SystemTypes } from "@VS/types";
  // @ts-ignore
  import DrawingSection from "./DrawingSection.svelte";
  import BeamCard from "./BeamCard.svelte";
  // @ts-ignore
  import SignatureCard from "./SignatureCard.svelte";
  import ErrorUICard from "./ErrorUiCard.svelte";
  import ReplaceCard from "./ReplaceCard.svelte";

  type StaffActionTypes =
    | "drawing"
    | "replace"
    | "beams"
    | "signatures"
    | "error-ui";

  let staff: MusicStaff | null = $state(null);
  let staffMap: Record<string, MusicStaff> = $state({});
  let currentStaffType: SystemTypes = $state("grand");
  let currentStaffAction: StaffActionTypes = $state("drawing");

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
    }
  }

  function handleStaffSelect(staffT: SystemTypes) {
    staff = staffMap[staffT];
    currentStaffType = staffT;
  }

  function handleStaffActionSelect(action: StaffActionTypes) {
    currentStaffAction = action;
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

<div class="quick-actions">
  <div class="toggles">
    <button
      class="toggle text"
      class:active={currentStaffType === "grand"}
      onclick={() => handleStaffSelect("grand")}>Grand Staff</button
    >
    <button
      class="toggle text"
      class:active={currentStaffType === "treble"}
      onclick={() => handleStaffSelect("treble")}>Treble Staff</button
    >
    <button
      class="toggle text"
      class:active={currentStaffType === "bass"}
      onclick={() => handleStaffSelect("bass")}>Bass Staff</button
    >
    <button
      class="toggle text"
      class:active={currentStaffType === "alto"}
      onclick={() => handleStaffSelect("alto")}>Alto Staff</button
    >
  </div>

  <hr />

  <div class="actions">
    <button onclick={() => staff?.justifyNotes()}>Justify Notes</button>
    <button onclick={() => staff?.clearAllNotes()}>Clear Notes</button>
  </div>
</div>

<div class="toggles staff-actions">
  <button
    class="toggle text"
    class:active={currentStaffAction === "drawing"}
    onclick={() => handleStaffActionSelect("drawing")}>Drawing</button
  >
  <button
    class="toggle text"
    class:active={currentStaffAction === "replace"}
    onclick={() => handleStaffActionSelect("replace")}>Replace</button
  >
  <button
    class="toggle text"
    class:active={currentStaffAction === "beams"}
    onclick={() => handleStaffActionSelect("beams")}>Beams</button
  >
  <button
    class="toggle text"
    class:active={currentStaffAction === "signatures"}
    onclick={() => handleStaffActionSelect("signatures")}>Signatures</button
  >
  <button
    class="toggle text"
    class:active={currentStaffAction === "error-ui"}
    onclick={() => handleStaffActionSelect("error-ui")}>ErrorUI</button
  >
</div>

<div>
  {#if currentStaffAction === "drawing"}
    <DrawingSection bind:staffInstance={staff} />
  {:else if currentStaffAction === "replace"}
    <ReplaceCard bind:staffInstance={staff} />
  {:else if currentStaffAction === "beams"}
    <BeamCard bind:staffInstance={staff} />
  {:else if currentStaffAction === "signatures"}
    <SignatureCard bind:staffInstance={staff} />
  {:else if currentStaffAction === "error-ui"}
    <ErrorUICard bind:musicStaffInstance={staff} />
  {/if}
</div>

<style>
  .staff-container {
    border-bottom: 0;
  }

  .quick-actions {
    padding: var(--space-12);
    padding-top: 0;

    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .toggles.staff-actions {
    margin-top: var(--space-24);
    border: 0;

    & button:not(.active) {
      background-color: transparent;
    }
  }

  hr {
    margin: var(--space-16) 0;
    border: 0;
    border-top: 1px solid var(--color-border);
  }

  .actions {
    display: flex;
    justify-content: end;
    gap: var(--space-8);
    margin-top: var(--space-16);

    max-width: 500px;
    margin-inline: auto;
  }

  .hide {
    display: none;
  }
</style>
