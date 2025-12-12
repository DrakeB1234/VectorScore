import type { NoteObj, StaffTypes } from "../types";

export interface StaffStrategy {
  drawStaff(width: number): void;
  calculateNoteYPos(note: Omit<NoteObj, "accidental">): number;
}

export type StaffParams = {
  staffType: StaffTypes;
  paddingTop: number;
  paddingBottom: number;
  topLineNote: NoteObj;
  bottomLineNote: NoteObj;
}