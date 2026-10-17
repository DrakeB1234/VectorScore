export const activeComponents = [
  "standard-staff",
  "scrolling-staff",
  "rhythm-staff",
  "guitar",
] as const;
export type ActiveComponent = (typeof activeComponents)[number];
