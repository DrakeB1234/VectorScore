import RhythmStaff from "@VS/core/RhythmStaff";

export function TESTMeasure1(staff: RhythmStaff) {
  staff.drawMeasure([
    { type: "note", duration: "q" },
    { type: "note", duration: "q" },
    { type: "rest", duration: "q" },
    { type: "beam", durations: "ess" },
  ]);
  staff.drawMeasure([
    { type: "note", duration: "q." },
    { type: "beam", durations: "eee" },
    { type: "rest", duration: "q" },
  ]);
}

export function TESTMeasure2(staff: RhythmStaff) {
  staff.drawMeasure([
    { type: "beam", durations: "ssss" },
    { type: "note", duration: "q." },
    { type: "beam", durations: "eee" },
  ]);
  staff.drawMeasure([{ type: "note", duration: "w" }]);
}

export function TESTMeasureBROKEN(staff: RhythmStaff) {
  staff.drawMeasure([
    { type: "note", duration: "q" },
    { type: "beam", durations: "ssss" },
    { type: "beam", durations: "ee" },
    { type: "note", duration: "q" },
  ]);
  staff.drawMeasure([{ type: "note", duration: "w" }]);
}

export function TESTMeasureSixteenths(staff: RhythmStaff) {
  staff.drawMeasure([
    { type: "beam", durations: "ssss" },
    { type: "beam", durations: "ssss" },
  ]);
  staff.drawMeasure([
    { type: "beam", durations: "ssss" },
    { type: "beam", durations: "ssss" },
  ]);
}
