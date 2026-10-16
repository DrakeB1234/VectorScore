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
        topNumber: 3,
        bottomNumber: 4,
      },
    });

    if (staffType === "grand") {
      selectedStaff = staff;

      staff.drawBatchElements("C4q C4s-F4s-D5e [C4,E4,G4]q");
      staff.justifyNotes();
    }

    availableStaffs.push(staff);
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
