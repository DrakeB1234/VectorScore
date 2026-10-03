<script lang="ts">
  import type { ActiveComponent } from "./helpers";
  import Navbar from "./lib/Navbar.svelte";
  import GuitarChords from "./lib/GuitarChords.svelte";
  import { RenderScan } from "svelte-render-scan";
  import ScrollingStaff from "./lib/ScrollingStaff.svelte";
  import RhythmStaff from "./lib/RhythmStaff.svelte";
  import StandardStaff from "./lib/MusicStaff/StandardStaff.svelte";

  let activeComponent: ActiveComponent = $state("music-staff");
</script>

<RenderScan />

<main>
  <Navbar bind:activeComponent />

  {#if activeComponent === "music-staff"}
    <StandardStaff />
  {:else if activeComponent === "scrolling-staff"}
    <ScrollingStaff />
  {:else if activeComponent === "rhythm-staff"}
    <RhythmStaff />
  {:else}
    <GuitarChords />
  {/if}
</main>

<style>
  main {
    padding-bottom: 10em;
  }
</style>
