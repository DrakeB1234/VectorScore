<script lang="ts">
  import type { ActiveComponent } from "../helpers";
  import MaterialMoon from "./icons/MaterialMoon.svelte";
  import MaterialSun from "./icons/MaterialSun.svelte";

  let { activeComponent = $bindable() }: { activeComponent: ActiveComponent } =
    $props();

  let isDarkTheme = $state(false);

  function handleButtonClick(section: ActiveComponent) {
    activeComponent = section;
  }

  function handleToggleDarkTheme() {
    isDarkTheme = !isDarkTheme;

    if (isDarkTheme) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }
</script>

<nav>
  <img
    class="logo-img"
    src="/vector-score-icon.svg"
    alt=""
    height="32px"
    width="32px"
  />

  <div class="links">
    <button
      class="text"
      class:active={activeComponent === "music-staff"}
      onclick={() => handleButtonClick("music-staff")}>Music Staff</button
    >
    <button
      class="text"
      class:active={activeComponent === "scrolling-staff"}
      onclick={() => handleButtonClick("scrolling-staff")}
      >Scrolling Staff</button
    >
    <button
      class="text"
      class:active={activeComponent === "rhythm-staff"}
      onclick={() => handleButtonClick("rhythm-staff")}>Rhythm Staff</button
    >
    <button
      class="text"
      class:active={activeComponent === "guitar"}
      onclick={() => handleButtonClick("guitar")}>Guitar Chords</button
    >
  </div>

  <div class="theme-button">
    <button class="icon text" onclick={handleToggleDarkTheme}>
      {#if isDarkTheme}
        <MaterialSun />
      {:else}
        <MaterialMoon />
      {/if}
    </button>
  </div>
</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-8);
    background-color: var(--color-surface);

    border-bottom: 1px solid var(--color-border);

    overflow-x: auto;
  }

  .links {
    display: flex;
    gap: var(--space-4);
  }

  button {
    min-width: fit-content;
  }

  button.active {
    color: var(--color-primary);
  }

  .theme-button {
    margin-left: auto;
  }
</style>
