<script lang="ts">
  import type { ActiveComponent } from "./helpers";
  import Navbar from "./lib/Navbar.svelte";
  import { RenderScan } from "svelte-render-scan";
  import StandardStaff from "./lib/StandardStaff.svelte";

  let activeComponent: ActiveComponent = $state("music-staff");
</script>

<RenderScan />

<Navbar bind:activeComponent />

{#if activeComponent === "music-staff"}
  <StandardStaff />
{/if}
