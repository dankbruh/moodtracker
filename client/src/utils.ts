import { interpolateHcl } from "d3-interpolate";
import add from "date-fns/add";
import getDay from "date-fns/getDay";
import set from "date-fns/set";
import { MOOD_RANGE, TIME } from "./constants";
import { NormalizedMeditations, NormalizedMoods } from "./types";

export const computeAverageMoodInInterval = (
  moods: NormalizedMoods,
  fromDate: Date,
  toDate: Date
): number | undefined => {
  if (!moods.allIds.length) {
    // eslint-disable-next-line no-console
    console.warn("No moods");
    return;
  }

  const earliestMoodTime = new Date(moods.allIds[0]).getTime();
  const latestMoodTime = new Date(
    moods.allIds[moods.allIds.length - 1]
  ).getTime();

  const d0 = fromDate.getTime();
  const d1 = toDate.getTime();

  if (d1 < d0) {
    // eslint-disable-next-line no-console
    console.warn("fromDate must be equal to or before toDate");
    return;
  }
  if (d0 > latestMoodTime || d1 < earliestMoodTime) return;

  if (moods.allIds.length === 1) return moods.byId[moods.allIds[0]].mood;
  if (d1 === earliestMoodTime) return moods.byId[toDate.toISOString()].mood;
  if (d0 === latestMoodTime) return moods.byId[fromDate.toISOString()].mood;

  const maxArea =
    (Math.min(d1, latestMoodTime) - Math.max(d0, earliestMoodTime)) *
    (MOOD_RANGE[1] - MOOD_RANGE[0]);

  let area = 0;

  const relevantMoodIds = getEnvelopingMoodIds(moods.allIds, fromDate, toDate);

  for (let j = 1; j < relevantMoodIds.length; j++) {
    const id0 = relevantMoodIds[j - 1];
    const t0 = new Date(id0).getTime();
    const mood0 = moods.byId[id0].mood;

    const id1 = relevantMoodIds[j];
    const t1 = new Date(id1).getTime();
    const mood1 = moods.byId[id1].mood;

    if (t0 < d0 && t1 > d1) {
      area += trapeziumArea(
        mood0 + ((mood1 - mood0) * (d0 - t0)) / (t1 - t0),
        mood0 + ((mood1 - mood0) * (d1 - t0)) / (t1 - t0),
        d1 - d0
      );
      continue;
    }

    if (t0 < d0) {
      area += trapeziumArea(
        mood1 + ((mood0 - mood1) * (t1 - d0)) / (t1 - t0),
        mood1,
        t1 - d0
      );
      continue;
    }

    if (t1 > d1) {
      area += trapeziumArea(
        mood0,
        mood0 + ((mood1 - mood0) * (d1 - t0)) / (t1 - t0),
        d1 - t0
      );
      break;
    }

    area += trapeziumArea(mood0, mood1, t1 - t0);
  }

  return (area / maxArea) * (MOOD_RANGE[1] - MOOD_RANGE[0]);
};

export const computeMean = (xs: number[]): number | undefined => {
  if (!xs.length) return undefined;
  let sum = 0;
  for (let i = 0; i < xs.length; i++) sum += xs[i];
  return sum / xs.length;
};

export const computeSecondsMeditatedInInterval = (
  meditations: NormalizedMeditations,
  d0: Date,
  d1: Date
): number => {
  const ids = getIdsInInterval(meditations.allIds, d0, d1);
  let sum = 0;
  for (let i = 0; i < ids.length; i++) sum += meditations.byId[ids[i]].seconds;
  return sum;
};

export const computeStandardDeviation = (xs: number[]): number => {
  if (xs.length <= 1) return 0;

  // mean is only undefined when xs.length is 0
  const mean = computeMean(xs)!;
  let sumOfSquaredDifferences = 0;
  for (const x of xs) sumOfSquaredDifferences += (x - mean) ** 2;
  return Math.sqrt(sumOfSquaredDifferences / (xs.length - 1));
};

export const counter = (xs: string[]): { [word: string]: number } => {
  const count: { [word: string]: number } = {};
  for (const x of xs) {
    if (count[x]) count[x] += 1;
    else count[x] = 1;
  }
  return count;
};

export const createDateFromLocalDateString = (dateString: string) =>
  new Date(`${dateString}T00:00:00`);

export const getNormalizedTagsFromDescription = (
  description: string
): string[] => {
  const descriptions: string[] = [];
  for (const word of description.split(/\s+/)) {
    if (!word) continue;
    descriptions.push(`${word[0].toUpperCase()}${word.toLowerCase().slice(1)}`);
  }
  return descriptions;
};

// hard to name, but will return all moods within
// date range and if they exist will also include
// first mood before range and first mood after range
export const getEnvelopingMoodIds = (
  ids: NormalizedMoods["allIds"],
  fromDate: Date,
  toDate: Date
): NormalizedMoods["allIds"] => {
  if (fromDate > toDate) throw Error("`fromDate` should not be after `toDate`");

  // We use these ISO-8601 strings to do string comparison of dates.
  // This is a very hot code path and testing indicates that this
  // comparison method is significantly faster than converting
  // and comparing in date object format or in number format.
  // A limitation is that the format of all IDs must be derived
  // from `toISOString` otherwise this may not function as expected.
  const fromIso = fromDate.toISOString();
  const toIso = toDate.toISOString();

  let i = 0;
  for (; i < ids.length; i++) if (ids[i] >= fromIso) break;

  const envelopingMoodIds: NormalizedMoods["allIds"] = [];

  if (i > 0) envelopingMoodIds.push(ids[i - 1]);

  for (; i < ids.length; i++) {
    const id = ids[i];
    envelopingMoodIds.push(id);
    if (id > toIso) break;
  }

  return envelopingMoodIds;
};

export const getIdsInInterval = (
  ids: string[],
  fromDate: Date,
  toDate: Date
): typeof ids => {
  if (fromDate > toDate) throw Error("`fromDate` should not be after `toDate`");

  const idsInInterval: typeof ids = [];

  for (const id of ids) {
    const date = new Date(id);
    if (date < fromDate) continue;
    if (date > toDate) break;
    idsInInterval.push(id);
  }

  return idsInInterval;
};

export const formatIsoDateInLocalTimezone = (date: Date): string =>
  `${formatIsoMonthInLocalTimezone(date)}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;

export const formatIsoDateHourInLocalTimezone = (date: Date): string =>
  `${formatIsoDateInLocalTimezone(date)}T${String(date.getHours()).padStart(
    2,
    "0"
  )}:00:00.000Z`;

export const formatIsoMonthInLocalTimezone = (date: Date): string =>
  `${formatIsoYearInLocalTimezone(date)}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

export const formatIsoYearInLocalTimezone = (date: Date): string =>
  String(date.getFullYear());

export const formatSecondsAsTime = (seconds: number): string =>
  `${String(Math.floor(seconds / TIME.secondsPerMinute)).padStart(
    2,
    "0"
  )}:${String(Math.floor(seconds % TIME.secondsPerMinute)).padStart(2, "0")}`;

export const getWeekdayIndex = (date: Date): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  const dateFnsWeekdayIndex = getDay(date);
  return ((dateFnsWeekdayIndex ? dateFnsWeekdayIndex : TIME.daysPerWeek) -
    1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export const isoDateFromIsoDateAndTime = (dateString: string): string =>
  dateString.slice(0, dateString.indexOf("T"));

export const mapRight = <A, B>(xs: A[], f: (x: A) => B): B[] => {
  const ys = [];
  for (let i = xs.length - 1; i >= 0; i--) ys.push(f(xs[i]));
  return ys;
};

const getColorNegative = interpolateHcl("#1747f0", "#00e0e0");
const getColorPositive = interpolateHcl("#00e0e0", "#30ff20");
const getColor = (n: number) =>
  n < 0.5 ? getColorNegative(n * 2) : getColorPositive((n - 0.5) * 2);

const colorCache = new Map<string, string>();
export const moodToColor = (mood: number): string => {
  const roundedMood = mood.toFixed(1);
  const cachedColor = colorCache.get(roundedMood);
  if (cachedColor) return cachedColor;
  const color = getColor(Number(roundedMood) / 10);
  colorCache.set(roundedMood, color);
  return color;
};

export const roundDateDown = (date: Date): Date =>
  set(date, {
    hours: 0,
    milliseconds: 0,
    minutes: 0,
    seconds: 0,
  });

export const roundDateUp = (date: Date): Date => {
  const roundedDownDate = roundDateDown(date);
  return Number(roundedDownDate) === Number(date)
    ? date
    : add(roundedDownDate, { days: 1 });
};

export const trapeziumArea = (a: number, b: number, h: number): number =>
  ((a + b) / 2) * h;
