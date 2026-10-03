<script lang="ts">
  import type { StandardStaffDrawOptions } from "@VS/core/StandardStaff";
  import type MusicStaff from "@VS/core/StandardStaff";
  import {
    chordConfig,
    noteConfig,
    type BeamableConfig,
  } from "@VS/helpers/noteHelpers";

  let { staffInstance = $bindable() }: { staffInstance: MusicStaff | null } =
    $props();

  type BeamNote = {
    type: "note";
    note: string;
  };

  type BeamChord = {
    type: "chord";
    notes: string[];
    duration: string;
  };

  type BeamInput = BeamNote | BeamChord;

  let rawInputString = $state("C4e/E4e/G4e");
  let beamEntries: BeamInput[] = [];

  let isTop = $state(true);

  let currentDrawOptions: StandardStaffDrawOptions = $derived({
    staff: isTop ? "top" : "bottom",
  });

  export function parseBeamString(input: string): BeamInput[] {
    // Split the string by '/' and remove any empty entries or extra whitespace
    const rawEntries = input.split(/\s*\/\s*/).filter((str) => str.length > 0);

    return rawEntries.map((entry) => {
      // If it starts with a bracket, parse it as a chord, IE [C4,E4]q
      if (entry.startsWith("[")) {
        const match = entry.match(/^\[(.*?)\](.*)$/);

        if (!match) {
          throw new Error(`Invalid chord format in beam string: ${entry}`);
        }

        const rawPitches = match[1];
        const duration = match[2];

        return {
          type: "chord",
          notes: rawPitches.split(/\s*,\s*/), // Split pitches by comma
          duration: duration,
        };
      }

      // Otherwise a note, IE C4e
      return {
        type: "note",
        note: entry,
      };
    });
  }

  function handleDraw() {
    if (!staffInstance) return;

    try {
      beamEntries = parseBeamString(rawInputString);

      const entries: BeamableConfig[] = [];

      beamEntries.forEach((entry) => {
        if (entry.type === "note") entries.push(noteConfig(entry.note));
        if (entry.type === "chord")
          entries.push(chordConfig(entry.notes, entry.duration));
      });

      staffInstance.drawBeam(entries, currentDrawOptions);
    } catch (e) {
      console.error(e);
    }
  }
</script>

<div class="card">
  <p class="card-title">Render Beam</p>

  <div class="card-section">
    <label class="checkbox-group">
      Draw on top staff?
      <input type="checkbox" bind:checked={isTop} />
    </label>
  </div>
  <div class="card-section">
    <div class="card-input-group">
      <label for="beam-input">Input</label>
      <input
        id="beam-input"
        bind:value={rawInputString}
        placeholder="C4e/[C4,E4]e/E4e"
      />
    </div>
    <div class="card-buttons">
      <button class="primary" onclick={handleDraw}>Draw</button>
    </div>
  </div>
</div>

<style>
  .card-buttons {
    position: sticky;
    bottom: 0;

    padding-top: var(--space-12);
  }

  .card {
    max-width: 600px;
    margin: var(--space-8) auto;
  }
</style>
