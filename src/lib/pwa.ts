export function isStandalonePwa() {
  return window.matchMedia("(display-mode: standalone)").matches;
}
