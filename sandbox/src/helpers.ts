export const activeComponents = ["music-staff", "scrolling-staff", "rhythm-staff", "guitar"] as const;
export type ActiveComponent = typeof activeComponents[number];