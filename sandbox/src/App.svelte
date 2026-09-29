<script lang="ts">
  import type { ActiveComponent } from "./helpers";
  import Navbar from "./lib/Navbar.svelte";
  import GuitarChords from "./lib/GuitarChords.svelte";
  import MusicStaff from "./lib/MusicStaff.svelte";
  import { RenderScan } from "svelte-render-scan";

  let activeComponent: ActiveComponent = $state("musicstaff");
</script>

<RenderScan />

<Navbar bind:activeComponent />

{#if activeComponent === "musicstaff"}
  <MusicStaff />
{:else if activeComponent === "scrolling-staff"}
  <div>Scrolling staff</div>
{:else}
  <GuitarChords />
{/if}
