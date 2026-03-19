export function normalizeApiTimestamp(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Already has timezone info (Z or ±HH:mm / ±HHmm)
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return s;

  // Common backend formats:
  // - "2026-02-28 12:34:56" (space separator, no tz) -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    return s.replace(' ', 'T') + 'Z';
  }

  // - "2026-02-28T12:34:56" (no tz) -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
    return s + 'Z';
  }

  // Fallback: let Date try its best
  return s;
}

export function parseApiDate(input?: string | null): Date | null {
  const normalized = normalizeApiTimestamp(input);
  if (!normalized) return null;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRelativeTime(
  input?: string | Date | null,
  now: Date = new Date()
): string {
  const date =
    input instanceof Date
      ? input
      : typeof input === 'string'
        ? parseApiDate(input)
        : null;

  if (!date) return '—';

  const diff = now.getTime() - date.getTime();

  // Future timestamps (clock skew / server time) should not show "negative minutes ago"
  if (diff < 0) return 'Just now';

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`;

  return date.toLocaleDateString();
}

