import type { AccidentalType, NoteObj, ClefTypes } from "../types";

export interface StaffStrategy {
  drawStaff(width: number, staffLayer: SVGGElement): number;
  calculateNoteYPos(note: Omit<NoteObj, "accidental">): number;
  getLedgerLinesX(note: Omit<NoteObj, "accidental">, yPos: number): LedgerLineEntry[];
  shouldNoteFlip(noteYPos: number): boolean;
  getKeySignatureYPositions(type: AccidentalType, count: number): number[][];
}

export type StaffParams = {
  staffType: ClefTypes;
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