export type StaffTypes = 'treble' | 'bass' | 'alto' | 'grand';

export type NoteObj = {
  name: NoteNames;
  octave: number;
  accidental?: Accidentals;
  duration?: Durations;
}

export type NoteNames = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Durations = 'w' | 'h' | 'q';
export type Accidentals = '#' | 'b';
