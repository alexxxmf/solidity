import * as _ from "lodash";

export function countdownMessage(
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): string {
  const dayPart = `${days} day${days === 1 ? "" : "s"}`;
  const hourPart = `${hours} hour${hours === 1 ? "" : "s"}`;
  const minutePart = `${minutes} minute${minutes === 1 ? "" : "s"}`;

  let parts: string[] = [];

  if (days > 0) {
    parts.push(dayPart);
  }
  if (hours > 0) {
    parts.push(hourPart);
  }
  if (minutes > 0) {
    parts.push(minutePart);
  }

  const secondPart = `${seconds} second${seconds === 1 ? "" : "s"}`;
  const firstPart = _.join(parts, ", ");
  return _.join(
    firstPart.length ? [firstPart, secondPart] : [secondPart],
    " & "
  );
}
