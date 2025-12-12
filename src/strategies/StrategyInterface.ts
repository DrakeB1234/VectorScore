import type { NoteObj, StaffTypes } from "../types";

export interface StaffStrategy {
  drawStaff(width: number): void;
  handleDrawNote(note: NoteObj): SVGGElement;
}

export type StaffParams = {
  staffType: StaffTypes;
  paddingTop: number;
  paddingBottom: number;
  topLineNote: NoteObj;
  bottomLineNote: NoteObj;
}