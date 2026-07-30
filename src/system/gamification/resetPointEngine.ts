export function calculateResetPoints(expectedPoints: number, actualXp: number, expectedXp: number) {
  if (expectedXp <= 0) {
    return 0;
  }

  return Math.round(expectedPoints * (actualXp / expectedXp));
}
