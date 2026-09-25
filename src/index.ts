export { default as MusicStaff } from './core/MusicStaff';
export { default as RhythmStaff } from './core/RhythmStaff';
export { default as ScrollingStaff } from './core/ScrollingStaff';
export { default as GuitarChord } from './core/GuitarChord';

export type { MusicStaffUserOptions } from './core/MusicStaff';
export type { RhythmStaffOptions } from './core/RhythmStaff';
export type { ScrollingStaffOptions } from './core/ScrollingStaff';
export type { GuitarChordOptions } from './core/GuitarChord';

export type { ClefTypes as StaffTypes } from './types';
export type { GuitarChordDrawOptions, GuitarBarreDef } from './types';

// NEW IMPORTS WITH MAJOR RELEASE
export type { DrawOptions } from './core/MusicStaff';
export type { ReplaceConfig, NoteReplaceConfig, ChordReplaceConfig, RestReplaceConfig } from './core/MusicStaff';