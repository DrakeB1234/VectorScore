export const activeComponents = ["musicstaff", "scrolling-staff", "guitar"] as const;
export type ActiveComponent = typeof activeComponents[number];