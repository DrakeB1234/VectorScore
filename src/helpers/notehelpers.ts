import { type GlyphNames } from "../glyphs";
import type { Accidentals, Durations, NoteNames, NoteObj } from "../types";

const REGEX_NOTE_STRING = /^(?<name>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)(?<duration>[whqeWHQE]?)$/;
const REGEX_DURATION_NOTE_STRING = /^[whqeWHQE]$/;
const REGEX_REST_STRING = /^(?<rest>[rR])(?<duration>[whqeWHQE]?)$/;

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as NoteNames[];

export function parseNoteString(noteString: string): NoteObj {
  const match = noteString.match(REGEX_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${noteString}. Expected format: [A-Ga-g][#|b]?[0-9][w|h|q|e].`);
  };

  let { name, accidental, octave, duration } = match.groups;

  // Normalize input
  name = name.toUpperCase();
  duration = duration.toLowerCase();

  if (!duration) {
    duration = 'w';
  }

  const noteObj: NoteObj = {
    name: name as NoteNames,
    octave: parseInt(octave),
    duration: duration as Durations,
  }

  if (accidental) {
    noteObj.accidental = accidental as Accidentals;
  }

  return noteObj;
}

export function parseDurationNoteString(note: string): Durations {
  const match = note.match(REGEX_DURATION_NOTE_STRING);
  if (!match) throw new Error(`Invalid note duration '${note}'. Use w | h | q | e.`);
  let string = match[0].toString().toLowerCase() as Durations;

  return string;
};

export function parseRestString(rest: string): Durations {
  const match = rest.match(REGEX_REST_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid rest string format: ${rest}. Expected format: [r][w|h|q|e].`);
  };

  let duration = match.groups.duration;

  // Normalize input
  duration = duration.toLowerCase();

  if (!duration) {
    duration = 'w';
  }

  return duration as Durations;
}

export function getGlyphNameByClef(clef: string): GlyphNames {
  let searchKey: GlyphNames | undefined;

  switch (clef) {
    case 'treble':
      searchKey = 'CLEF_TREBLE';
      break;
    case 'bass':
      searchKey = 'CLEF_BASS';
      break;
    case 'alto':
      searchKey = 'CLEF_ALTO';
      break;
  }
  if (!searchKey) throw new Error(`Invalid clef type: ${clef}. Valid clef types are: treble, bass, alto.`);

  return searchKey;
}

// DOES NOT CONSIDER ACCIDENTAL INTO FINAL SEMITONE AMOUNT
export function noteToAbsoluteSemitone(note: NoteObj): number {
  let semitone = NOTE_NAMES.indexOf(note.name);
  semitone += (note.octave * 12)
  return semitone;
}

export function getNoteSpacingFromReference(referenceNote: Pick<NoteObj, "name" | "octave">, targetNote: Pick<NoteObj, "name" | "octave">): number {
  const nameDiff = NOTE_NAMES.indexOf(referenceNote.name) - NOTE_NAMES.indexOf(targetNote.name);
  return nameDiff + (referenceNote.octave - targetNote.octave) * 7;
}