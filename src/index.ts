export { default as MusicStaff } from './core/MusicStaff';
export { default as RhythmStaff } from './core/RhythmStaff';
export { default as ScrollingStaff } from './core/ScrollingStaff';
export { default as GuitarChord } from './core/GuitarChord';

export type { MusicStaffUserOptions } from './core/MusicStaff';
export type { RhythmStaffUserOptions } from './core/RhythmStaff';
export type { ScrollingStaffUserOptions } from './core/ScrollingStaff';
export type { GuitarChordOptions } from './core/GuitarChord';

export type { ClefTypes as StaffTypes } from './types';
export type { GuitarChordDrawOptions, GuitarBarreDef } from './types';

// NEW IMPORTS WITH MAJOR RELEASE

// Music Staff Exports
export type { DrawOptions } from './core/MusicStaff';
export type { MusicStaffDrawConfig } from './core/MusicStaff';


// General config constructors, for use in drawing methods
export { noteConfig, chordConfig, restConfig, beamConfig } from './helpers/noteHelpers';