<script lang="ts">
  import type { ActiveComponent } from "./helpers";
  import Navbar from "./lib/Navbar.svelte";
  import GuitarChords from "./lib/GuitarChords.svelte";
  import MusicStaff from "./lib/MusicStaff/MusicStaff.svelte";
  import { RenderScan } from "svelte-render-scan";
  import ScrollingStaff from "./lib/ScrollingStaff.svelte";
  import RhythmStaff from "./lib/RhythmStaff.svelte";

  let activeComponent: ActiveComponent = $state("music-staff");
</script>

<RenderScan />

<Navbar bind:activeComponent />

{#if activeComponent === "music-staff"}
  <MusicStaff />
{:else if activeComponent === "scrolling-staff"}
  <ScrollingStaff />
{:else if activeComponent === "rhythm-staff"}
  <RhythmStaff />
{:else}
  <GuitarChords />
{/if}
