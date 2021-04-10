export function pretty(object: unknown): string {
  return JSON.stringify(object, null, 2);
}