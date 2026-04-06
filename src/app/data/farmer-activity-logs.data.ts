/** ISO timestamps for demo data; replace with API responses later. */
export interface FarmerActivityLog {
  user: string;
  action: string;
  date: string;
}

export interface FarmerActivityTabEntry {
  userName: string;
  action: string;
  when: string;
}

type LogSeed = Omit<FarmerActivityLog, 'user'>;

const DEFAULT_SEED: LogSeed[] = [
  { action: 'Opened app', date: '2026-04-06T08:16:00.000Z' },
  { action: 'Viewed reports', date: '2026-04-06T10:42:00.000Z' },
  { action: 'Updated profile', date: '2026-04-05T16:10:00.000Z' },
  { action: 'Viewed devices', date: '2026-04-05T11:28:00.000Z' },
];

const SEED_BY_FARMER_ID: Record<string, LogSeed[]> = {
  '1': [
    { action: 'Opened app', date: '2026-04-06T08:16:00.000Z' },
    { action: 'Viewed Central Hub Alpha telemetry', date: '2026-04-06T10:42:00.000Z' },
    { action: 'Updated profile', date: '2026-04-05T16:10:00.000Z' },
    { action: 'Checked device status', date: '2026-04-05T11:28:00.000Z' },
    { action: 'Viewed activity logs', date: '2026-04-04T09:15:00.000Z' },
  ],
  '2': [
    { action: 'Opened app', date: '2026-04-06T07:05:00.000Z' },
    { action: 'Viewed reports', date: '2026-04-06T14:20:00.000Z' },
    { action: 'Reviewed Central Hub North alerts', date: '2026-04-05T09:00:00.000Z' },
    { action: 'Viewed devices', date: '2026-04-04T18:45:00.000Z' },
  ],
  '3': [
    { action: 'Opened app', date: '2026-04-06T06:30:00.000Z' },
    { action: 'Viewed field sensor readings', date: '2026-04-05T12:00:00.000Z' },
    { action: 'Exported monthly summary', date: '2026-04-03T15:40:00.000Z' },
  ],
};

export function getFarmerActivityLogs(farmerId: string, farmerName: string): FarmerActivityLog[] {
  const seed = SEED_BY_FARMER_ID[farmerId] ?? DEFAULT_SEED;
  return seed.map((s) => ({ ...s, user: farmerName }));
}

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function formatWhenLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  const sodNow = startOfDayMs(now);
  const sodD = startOfDayMs(d);
  const diffDays = Math.round((sodNow - sodD) / 86400000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Groups ISO activity rows into the same sections used on the farmer profile Activity tab.
 */
export function groupActivityLogsForFarmerTab(
  logs: FarmerActivityLog[],
  now = new Date(),
): { label: string; entries: FarmerActivityTabEntry[] }[] {
  const sorted = [...logs].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const sodNow = startOfDayMs(now);

  type Bucket = { label: string; order: number; sod: number; entries: FarmerActivityTabEntry[] };
  const map = new Map<string, Bucket>();

  for (const log of sorted) {
    const d = new Date(log.date);
    const sodD = startOfDayMs(d);
    const diffDays = Math.round((sodNow - sodD) / 86400000);

    let key: string;
    let label: string;
    let order: number;

    if (diffDays === 0) {
      key = '__today';
      label = 'Today';
      order = 0;
    } else if (diffDays === 1) {
      key = '__yesterday';
      label = 'Yesterday';
      order = 1;
    } else {
      key = `day:${sodD}`;
      label = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      order = 2 + (sodNow - sodD) / 86400000;
    }

    let b = map.get(key);
    if (!b) {
      b = { label, order, sod: sodD, entries: [] };
      map.set(key, b);
    }
    b.entries.push({
      userName: log.user,
      action: log.action,
      when: formatWhenLabel(log.date, now),
    });
  }

  return [...map.values()].sort((a, b) => a.order - b.order);
}
