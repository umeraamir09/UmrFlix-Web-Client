export default function formatRuntimeTicks(ticks: number | null | undefined): string {
  if (ticks === null || ticks === undefined || isNaN(ticks) || ticks <= 0) {
    return 'Unknown';
  }
  
  const totalSeconds = Math.floor(ticks / 10_000_000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`); // only show seconds if < 1 hour

  return parts.join(' ');
}
