<script lang="ts">
  import StandardStaff, { type StandardStaffPositionData, type StandardStaffUserOptions } from "@VS/core/StandardStaff";
  import { TESTBarlines, TESTBatchConfigDrawing, TESTBatchStringDrawing, TESTBeams, TESTChords, TESTConfigDrawing, TESTDrawScale, TESTNotes, TESTRests, TESTStringDrawing } from "./standardStaffTests";
  import { type SystemTypes } from "@VS/types";

  const staffOptions: StandardStaffUserOptions = {
    width: 600
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

  let uiStaff: StandardStaff;
  let currentUI = 0;
  let elementPosData: StandardStaffPositionData[] = [];
  let markerWrapper: SVGGElement;

  function setupUIStaff(node: HTMLElement) {
    uiStaff = new StandardStaff(node, {
      ...staffOptions,
      staffType: "treble",
      noteStartX: 40,
      paddingTop: 31
    });
    TESTDrawScale(uiStaff);
    elementPosData = uiStaff.getAllPositionData();

    markerWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markerWrapper.classList.add("note-ui");

    const marker = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    marker.setAttribute("width", "24");
    marker.setAttribute("height", "55");
    marker.setAttribute("x", "-12");
    marker.setAttribute("y", "0");
    marker.setAttribute("fill", "#00aaff33");
    markerWrapper.appendChild(marker);
    uiStaff.uiLayer.appendChild(markerWrapper);

    uiNext();

    const textWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const noteNames = ["C", "D", "E", "F", "G", "A", "B"];
    elementPosData.forEach((data, i) => {
      const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElement.innerHTML = noteNames[i];
      textElement.setAttribute("x", data.x.toString());
      textElement.setAttribute("y", "-20");
      textElement.setAttribute("text-anchor", "middle")

      textWrapper.appendChild(textElement);
    });
    uiStaff.uiLayer.appendChild(textWrapper);
  }

  function uiNext() {
    if (currentUI > elementPosData.length - 1) {
      currentUI = 0;
    }
    const positionData = elementPosData[currentUI];
    markerWrapper.setAttribute("transform", `translate(${positionData.x}, 0)`);

    currentUI++;
  }
</script>

<main>
  <div class="staff-container">
    <div use:setupStaffTestFunc={TESTStringDrawing}></div>
    <div use:setupStaffTestFunc={TESTBatchStringDrawing}></div>
    <div use:setupStaffTestFunc={TESTConfigDrawing}></div>
    <div use:setupStaffTestFunc={TESTBatchConfigDrawing}></div>
    <div class="staff-inputs">
      <p>UI TEST</p>
      <div use:setupUIStaff></div>  
      <button onclick={uiNext}>UI Next</button>
    </div>
    <div class="staff-inputs">
      <p>BEAM TEST</p>
      <div use:setupStaffTestFunc={TESTBeams}></div>  
    </div>
    <div class="staff-inputs">
      <p>RESTS TEST</p>
      <div use:setupStaffTestFuncType={{ TESTFUNC: TESTRests, staffType: "treble"}}></div>  
    </div>
    <div class="staff-inputs">
      <p>NOTES TEST</p>
      <div use:setupStaffTestFuncType={{ TESTFUNC: TESTNotes, staffType: "treble"}}></div>  
    </div>
    <div class="staff-inputs">
      <p>BARLINES TEST</p>
      <div use:setupStaffTestFuncType={{ TESTFUNC: TESTBarlines, staffType: "bass"}}></div>  
    </div>
    <div class="staff-inputs">
      <p>CHORDS TEST</p>
      <div use:setupStaffTestFunc={TESTChords}></div>  
    </div>
  </div>
</main>

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