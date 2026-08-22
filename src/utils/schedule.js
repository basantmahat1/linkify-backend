/** Mongo query fragment: item is visible at `now` based on schedule window. */
export function visibleNowFilter(now = new Date()) {
  return {
    $and: [
      {
        $or: [
          { "schedule.startAt": null },
          { "schedule.startAt": { $exists: false } },
          { "schedule.startAt": { $lte: now } },
        ],
      },
      {
        $or: [
          { "schedule.endAt": null },
          { "schedule.endAt": { $exists: false } },
          { "schedule.endAt": { $gte: now } },
        ],
      },
    ],
  };
}

/** Whether a schedule object is currently visible. */
export function isScheduleActive(schedule, now = new Date()) {
  if (!schedule) return true;
  const { startAt, endAt } = schedule;
  if (startAt && new Date(startAt) > now) return false;
  if (endAt && new Date(endAt) < now) return false;
  return true;
}

const PRESET_DAYS = { "1d": 1, "3d": 3, "7d": 7, "30d": 30 };

/** Resolve endAt from an expiration preset relative to `from`. */
export function endAtFromPreset(expireAfter, from = new Date()) {
  const days = PRESET_DAYS[expireAfter];
  if (!days) return null;
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  return end;
}
