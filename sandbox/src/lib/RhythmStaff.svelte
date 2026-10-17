<script lang="ts">
  import RhythmStaff, { type RhythmStaffUserOptions } from "@VS/core/RhythmStaff";
  import { TESTMeasure1, TESTMeasure2, TESTMeasureBROKEN, TESTMeasureSixteenths } from "./rhythmStaffTests";

  const staffOptions: RhythmStaffUserOptions = {
    width: 600
  };

  const dummy = (staff: RhythmStaff) => { return }; 

  function setupStaffTestFunc(node: HTMLElement, {TESTFUNC, options }: { TESTFUNC: (staff: RhythmStaff) => void, options?: RhythmStaffUserOptions}) {
    const staff = new RhythmStaff(node, {
      ...staffOptions,
      ...options
    });
    TESTFUNC(staff);
  };

  const uiWidth = 20;
  const uiBeatDividend = 8;
  let uiStaff: RhythmStaff;
  let currentUI = 0;
  let markerWrapper: SVGGElement;

  function setupStaffUI(node: HTMLElement) {
    uiStaff = new RhythmStaff(node, {
      ...staffOptions,
    });
    TESTMeasure1(uiStaff);

    markerWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markerWrapper.classList.add("note-ui");

    const marker = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    marker.setAttribute("width", uiWidth.toString());
    marker.setAttribute("height", "80");
    marker.setAttribute("x", (-uiWidth / 2).toString());
    marker.setAttribute("y", "-40");
    marker.setAttribute("fill", "#00aaff33");
    markerWrapper.appendChild(marker);
    uiStaff.uiLayer.appendChild(markerWrapper);

    uiNext();
  };

  function uiNext() {
    let nextX = uiStaff.getBeatCoordinateX(currentUI, uiBeatDividend);
    if (nextX === -1) {
      currentUI = 0;
      nextX = uiStaff.getBeatCoordinateX(currentUI, uiBeatDividend);
    }
    markerWrapper.setAttribute("transform", `translate(${nextX}, 0)`);

    currentUI++;
  }
</script>

<div class="staff-container">
  <div use:setupStaffTestFunc={{ TESTFUNC: TESTMeasure2}}></div>
  <div use:setupStaffTestFunc={{ TESTFUNC: TESTMeasureBROKEN, options: { topNumber: 3}}}></div>
  <div use:setupStaffTestFunc={{ TESTFUNC: TESTMeasureSixteenths, options: { topNumber: 8, bottomNumber: 16}}}></div>
  <div class="staff-inputs">
    <p>UI TEST</p>
    <div use:setupStaffUI></div>
    <button onclick={uiNext}>UI Next</button>
  </div>
</div>

<style>
  .staff-container {
    padding-bottom: 4em;
  }

  .staff-inputs {
    display: grid;
  }

  .staff-inputs > p {
    margin-block: 1rem;
  }

  .staff-container > div:not(:first-child)::before {
    content: "";
    display: block;
    height: 1px;
    width: 100%;
    background-color: var(--color-border);
    margin-block: 0.5rem;
  }

  :global(.note-ui) {
    transition: transform 0.1s ease-in;
  }
</style>
