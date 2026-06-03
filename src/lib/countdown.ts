/**
 * Pure helper — convert a future ISO timestamp into a compact countdown
 * label like "2d 4h", "1h 23m", "7m 12s". Returns "—" if already past.
 * No live ticking; render once per page load. Live updates added later.
 */
export function countdownLabel(target?: string | null, now: Date = new Date()): string {
  if (!target) return "—";
  const diff = new Date(target).getTime() - now.getTime();
  if (diff <= 0) return "—";

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
