<script lang="ts">
  import StandardStaff, { type StandardStaffUserOptions } from "@VS/core/StandardStaff";
  import { TESTBatchConfigDrawing, TESTBatchStringDrawing, TESTConfigDrawing, TESTStringDrawing } from "./standardStaffTests";
  import { type SystemTypes } from "@VS/types";

  const staffOptions: StandardStaffUserOptions = {
    width: 500
  };

  function setupStaffTestFunc(node: HTMLElement, TESTFUNC: (staff: StandardStaff) => void) {
    const staff = new StandardStaff(node, staffOptions);
    TESTFUNC(staff);
  }

  function setupStaffTestFuncType(node: HTMLElement, {TESTFUNC, staffType }: { TESTFUNC: (staff: StandardStaff) => void, staffType: SystemTypes}) {
    const staff = new StandardStaff(node, {
      ...staffOptions,
      staffType
    });
    TESTFUNC(staff);
  }
</script>

<main>
  <div class="staff-container">
    <div use:setupStaffTestFunc={TESTStringDrawing}></div>
    <div use:setupStaffTestFunc={TESTBatchStringDrawing}></div>
    <div use:setupStaffTestFunc={TESTConfigDrawing}></div>
    <div use:setupStaffTestFunc={TESTBatchConfigDrawing}></div>
    <div use:setupStaffTestFuncType={{ TESTFUNC: TESTStringDrawing, staffType: "treble"}}></div>
    <div use:setupStaffTestFuncType={{ TESTFUNC: TESTStringDrawing, staffType: "bass"}}></div>
    <div use:setupStaffTestFuncType={{ TESTFUNC: TESTStringDrawing, staffType: "alto"}}></div>
  </div>
</main>

<style>
  .staff-container {
    padding-bottom: 4em;
  }

  .staff-container > div:not(:first-child)::before {
    content: "";
    display: block;
    height: 1px;
    width: 100%;
    background-color: var(--color-border);
    margin-block: 0.5rem;
  }
</style>