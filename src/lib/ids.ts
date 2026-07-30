export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
