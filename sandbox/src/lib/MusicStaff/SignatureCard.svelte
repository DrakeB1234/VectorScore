<script>
  let { musicStaffInstance = $bindable() } = $props();

  let inputState = $state({
    keySig: "",
    timeSig: "",
  });

  function changeKeySig(isRemove = false) {
    const value = inputState.keySig;

    if (isRemove || value === "") {
      musicStaffInstance?.removeKeySignature();
      return;
    }

    musicStaffInstance?.changeKeySignature(value);
  }

  function changeTimeSig(isRemove = false) {
    const valueParts = inputState.timeSig.split("/").map((e) => Number(e));

    if (isRemove || !valueParts) {
      musicStaffInstance?.removeTimeSignature();
      return;
    }

    musicStaffInstance?.changeTimeSignature(valueParts[0], valueParts[1]);
  }
</script>

<div class="card">
  <p class="card-title">Staff Signatures</p>
  <div class="card-section">
    <div class="card-input-group">
      <label for="key-sig">Key</label>
      <input id="key-sig" bind:value={inputState.keySig} placeholder="Bb" />
    </div>
    <div class="card-buttons">
      <button onclick={() => changeKeySig(true)}>Remove</button>
      <button class="primary" onclick={() => changeKeySig()}>Draw</button>
    </div>
  </div>

  <div class="card-section">
    <div class="card-input-group">
      <label for="time-sig">Time</label>
      <input id="time-sig" bind:value={inputState.timeSig} placeholder="4/4" />
    </div>
    <div class="card-buttons">
      <button onclick={() => changeTimeSig(true)}>Remove</button>
      <button class="primary" onclick={() => changeTimeSig()}>Draw</button>
    </div>
  </div>
</div>

<style>
  .card {
    max-width: 600px;
    margin: var(--space-8) auto;
  }
</style>
