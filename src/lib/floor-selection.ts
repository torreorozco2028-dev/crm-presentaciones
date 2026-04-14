export const DEFAULT_FLOOR_VIEWPORT_WIDTH = 1024;

export function getMaxFloorSelections(width: number) {
  return width < 768 ? 2 : 4;
}
