<script>
  import StandardStaff from "@VS/core/StandardStaff";

  let { selectedStaff = $bindable(null), availableStaffs = $bindable([]) } =
    $props();

  let currentStaffType = $derived(
    selectedStaff && selectedStaff.options.staffType,
  );

  function setupStaff(element, staffType = "grand") {
    const staff = new StandardStaff(element, {
      width: 600,
      scale: 1,
      staffType: staffType,
      paddingTop: 50,
      paddingBottom: 50,
      keySignature: "G",
      timeSignature: {
        topNumber: 4,
        bottomNumber: 4,
      },
    });

    if (staffType === "grand") {
      selectedStaff = staff;
    }

    availableStaffs.push(staff);

    staff.drawNote("C4w");
  }
</script>

<div class="staff-container">
  <div use:setupStaff={"grand"} class:hide={currentStaffType !== "grand"}></div>
  <div
    use:setupStaff={"treble"}
    class:hide={currentStaffType !== "treble"}
  ></div>
  <div use:setupStaff={"bass"} class:hide={currentStaffType !== "bass"}></div>
  <div use:setupStaff={"alto"} class:hide={currentStaffType !== "alto"}></div>
</div>

<style>
  .hide {
    display: none;
  }
</style>
