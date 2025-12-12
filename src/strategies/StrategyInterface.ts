import type { NoteObj, StaffTypes } from "../types";

export interface StaffStrategy {
  drawStaff(width: number): void;
  calculateNoteYPos(note: Omit<NoteObj, "accidental">): number;
  getLedgerLinesX(note: Omit<NoteObj, "accidental">, yPos: number): LedgerLineEntry[];
}

export type StaffParams = {
  staffType: StaffTypes;
  paddingTop: number;
  paddingBottom: number;
  topLineNote: NoteObj;
  topLineYPos: number;
  bottomLineYPos: number;
}

export type LedgerLineEntry = {
  x1: number,
  x2: number,
  yPos: number
}