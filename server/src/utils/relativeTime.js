export function relativeTimeFromDate(input) {
  if (!input) return "";

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Allow future/clock skew: clamp to 0
  const sec = Math.max(0, diffSec);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (sec < minute) return `${sec}s ago`;
  if (sec < hour) {
    const m = Math.floor(sec / minute);
    return `${m}m ago`;
  }
  if (sec < day) {
    const h = Math.floor(sec / hour);
    return `${h}h ago`;
  }

  // Yesterday/Today-ish
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(d);
  d1.setHours(0, 0, 0, 0);

  const days = Math.floor((d0.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";

  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

