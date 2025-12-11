import type { Accidentals, Durations, NoteNames, NoteObj } from "../types";

export const REGEX_NOTE_STRING = /^(?<name>[A-G])(?<accidental>[#b]?)(?<octave>\d)(?<duration>[whq]?)$/;

export function parseNoteString(noteString: string): NoteObj {
  const match = noteString.match(REGEX_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${noteString}. Expected format: [A-G][#|b]?[0-9][w|h|q].`);
  };

  let { name, accidental, octave, duration } = match.groups;
  console.log(`name: ${name}, accidental: ${accidental}, octave: ${octave}, duration: ${duration}`);

  if (!name) {
    throw new Error(`Invalid note name: ${name}. Valid note names are: C, D, E, F, G, A, B.`);
  };
  if (!octave) {
    throw new Error(`Invalid octave: ${octave}. Octave must be a number between 0 and 9.`);
  }
  if (!duration) {
    duration = 'w';
  }

  return {
    name: name as NoteNames,
    accidental: accidental as Accidentals,
    octave: parseInt(octave),
    duration: duration as Durations
  }
}