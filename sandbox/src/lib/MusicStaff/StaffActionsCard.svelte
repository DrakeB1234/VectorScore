<script>
  let { selectedStaff = $bindable(), availableStaffs = $bindable([]) } =
    $props();

  function handleSelectChange(event) {
    const value = event.target.value;
    const staff = availableStaffs.find((s) => s.options.staffType === value);

    if (staff) {
      selectedStaff = staff;
    }
  }
</script>

<div class="card">
  <div class="card-title">
    <p>Staff Actions</p>
  </div>
  <div class="card-section label-group__col">
    <label for="staff-select">Select Staff</label>
    <select id="staff-select" onchange={handleSelectChange}>
      {#each availableStaffs as staff (staff.options.staffType)}
        <option value={staff.options.staffType}
          >{staff.options.staffType}</option
        >
      {/each}
    </select>
  </div>

  <div class="card-divider"></div>

  <div class="card-section">
    <button onclick={() => selectedStaff && selectedStaff.clearAllNotes()}
      >Clear Notes</button
    >
    <button onclick={() => selectedStaff && selectedStaff.justifyNotes()}
      >Justify Notes</button
    >
  </div>
</div>
