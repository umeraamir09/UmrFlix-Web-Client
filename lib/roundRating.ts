export default function roundRating(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Math.round(value * 10) / 10;
}
