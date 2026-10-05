<script lang="ts">
  import { StandardStaff } from "@VS/index";

  let { selectedStaff = $bindable() }: { selectedStaff: StandardStaff | null } =
    $props();

  let drawMode: string = $state("note");

  let batchInput = $state("");

  function handleBatchInputChange() {
    selectedStaff && selectedStaff.drawBatchElements(batchInput);
  }
</script>

<div class="card">
  <div class="card-title">
    <p>Drawing</p>
  </div>

  <div class="card-content input-row">
    <label class="label-group__col">
      Batch Input
      <input
        type="text"
        bind:value={batchInput}
        placeholder="Enter batch input"
        onkeydown={(event) => event.key === "Enter" && handleBatchInputChange()}
      />
    </label>
    <button class="primary" onclick={handleBatchInputChange}>Draw</button>
  </div>

  <span class="card-divider-text">OR</span>

  <div class="card-content toggles">
    <button
      class="toggle"
      onclick={() => (drawMode = "note")}
      class:active={drawMode === "note"}>Note</button
    >
    <button
      class="toggle"
      onclick={() => (drawMode = "chord")}
      class:active={drawMode === "chord"}>Chord</button
    >
    <button
      class="toggle"
      onclick={() => (drawMode = "rest")}
      class:active={drawMode === "rest"}>Rest</button
    >
    <button
      class="toggle"
      onclick={() => (drawMode = "beam")}
      class:active={drawMode === "beam"}>Beam</button
    >
    <button
      class="toggle"
      onclick={() => (drawMode = "barline")}
      class:active={drawMode === "barline"}>Barline</button
    >
  </div>
</div>

<style>
  .input-row {
    display: flex;
    align-items: end;
    gap: var(--space-8);
  }
</style>
