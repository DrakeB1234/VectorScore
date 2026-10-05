<script lang="ts">
  import StandardStaff from "@VS/core/StandardStaff";
  // @ts-ignore
  import StaffActionsCard from "./StaffActionsCard.svelte";
  // @ts-ignore
  import StaffContainer from "./StaffContainer.svelte";
  // @ts-ignore
  import DrawCard from "./DrawCard.svelte";
  import { onMount } from "svelte";
  import {
    barlineConfig,
    chordConfig,
    noteConfig,
  } from "@VS/helpers/inputHelpers";

  let availableStaffs = $state([]);
  let selectedStaff: StandardStaff | null = $state(null);
  let activeToggle: string = $state("draw");

  const changeToggle = (toggle: string) => (activeToggle = toggle);
</script>

<main>
  <StaffContainer bind:selectedStaff bind:availableStaffs />

  <div class="card-container">
    <StaffActionsCard bind:selectedStaff bind:availableStaffs />
    <div class="main-card-wrapper">
      <div class="toggles">
        <button
          class="toggle"
          class:active={activeToggle === "draw"}
          onclick={() => changeToggle("draw")}>Draw</button
        >
        <button
          class="toggle"
          class:active={activeToggle === "replace"}
          onclick={() => changeToggle("replace")}>Replace</button
        >
      </div>
      {#if activeToggle === "draw"}
        <DrawCard bind:selectedStaff />
      {:else if activeToggle === "replace"}
        <p>Replace mode</p>
      {/if}
    </div>
  </div>
</main>

<style>
  .card-container {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: var(--space-16);
    max-width: 1200px;
    margin: 0 auto;

    padding: var(--space-16);
  }
</style>
