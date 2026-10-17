<script lang="ts">
  import type { ActiveComponent } from "./helpers";
  import Navbar from "./lib/Navbar.svelte";
  import { RenderScan } from "svelte-render-scan";
  import StandardStaff from "./lib/StandardStaff.svelte";
  import RhythmStaff from "./lib/RhythmStaff.svelte";

  let activeComponent: ActiveComponent = $state("standard-staff");
</script>

<RenderScan />

<Navbar bind:activeComponent />

{#if activeComponent === "standard-staff"}
  <StandardStaff />
{:else if activeComponent === "rhythm-staff"}
  <RhythmStaff />
{/if}
