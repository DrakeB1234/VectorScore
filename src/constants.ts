export const NAMESPACE = "vs";

export const VALID_CLASS_ATTR_REGEX = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

export function setTransformAttr(element: SVGElement, x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y))
    throw new Error(
      `SVGRenderer Transform Error: (Provided values x: ${x}, y: ${y}); Either x or y is invalid.`,
    );
  const roundX = Math.round(x * 100) / 100;
  const roundY = Math.round(y * 100) / 100;
  element.setAttribute("transform", `translate(${roundX}, ${roundY})`);
}
