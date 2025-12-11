import { describe, it, expect } from 'vitest';
import { parseNoteString } from '../src/helpers/notehelpers';

describe('parseNoteString', () => {

  // --- SUCCESS CASES ---

  it('should correctly parse a complete note string (C4q)', () => {
    const result = parseNoteString('C4q');
    expect(result).toEqual({
      name: 'C',
      accidental: '',
      octave: 4,
      duration: 'q',
    });
  });

  it('should correctly parse a sharp note with duration (G#5h)', () => {
    const result = parseNoteString('G#5h');
    expect(result).toEqual({
      name: 'G',
      accidental: '#',
      octave: 5,
      duration: 'h',
    });
  });

  it('should default duration to "w" when duration is omitted (A4)', () => {
    const result = parseNoteString('A4');
    expect(result).toEqual({
      name: 'A',
      accidental: '',
      octave: 4,
      duration: 'w',
    });
  });

  it('should correctly parse a flat note without duration (Bb3)', () => {
    const result = parseNoteString('Bb3');
    expect(result).toEqual({
      name: 'B',
      accidental: 'b',
      octave: 3,
      duration: 'w',
    });
  });

  // --- FAILURE CASES ---

  it('should throw an error for an invalid note name (H4q)', () => {
    expect(() => parseNoteString('H4q')).toThrow('Invalid note string format');
  });

  it('should throw an error for an invalid accidental (C!4q)', () => {
    expect(() => parseNoteString('C!4q')).toThrow('Invalid note string format');
  });

  it('should throw an error for an invalid duration (C4z)', () => {
    expect(() => parseNoteString('C4z')).toThrow('Invalid note string format');
  });

  it('should throw an error for a missing octave (Cq)', () => {
    expect(() => parseNoteString('Cq')).toThrow('Invalid note string format');
  });

});