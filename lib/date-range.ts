export function getIndiaTodayRange(now = new Date()) {
  const offsetMinutes = 330;
  const indiaTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);
  const start = new Date(
    Date.UTC(
      indiaTime.getUTCFullYear(),
      indiaTime.getUTCMonth(),
      indiaTime.getUTCDate(),
    ) -
      offsetMinutes * 60 * 1000,
  );
  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1),
  };
}
