export const NAMESPACE = "vs";

export const VALID_CLASS_ATTR_REGEX = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

export function setTransformAttr(element: SVGElement, x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`SVGRenderer Transform Error: (Provided values x: ${x}, y: ${y}); Either x or y is invalid.`);
  element.setAttribute("transform", `translate(${x}, ${y})`);
}