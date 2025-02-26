import { useSelector } from "react-redux";
import { normalizedMoodsSelector } from "../../../selectors";
import { NormalizedMoods } from "../../../types";
import {
  computeAverageMoodInInterval,
  getEnvelopingMoodIds,
} from "../../../utils";
import MoodChart from "../../shared/MoodChart";

const TRENDLINE_POINTS_COUNT = 32;
const TRENDLINE_MOVING_AVERAGE_PERIOD_COUNT = 3;

export const computeTrendlinePoints = (
  moods: NormalizedMoods,
  domain: [number, number]
): [number, number][] => {
  const period = (domain[1] - domain[0]) / TRENDLINE_POINTS_COUNT;
  const earliestMoodTime = new Date(moods.allIds[0]).getTime();
  const latestMoodTime = new Date(
    moods.allIds[moods.allIds.length - 1]
  ).getTime();

  const trendlinePoints: [number, number][] = [];

  for (let i = 0; i < TRENDLINE_POINTS_COUNT + 1; i++) {
    const t0 =
      domain[0] + (i - TRENDLINE_MOVING_AVERAGE_PERIOD_COUNT / 2) * period;
    const t1 = t0 + period * TRENDLINE_MOVING_AVERAGE_PERIOD_COUNT;
    const trendlineX = (t0 + t1) / 2;
    if (trendlineX < earliestMoodTime) continue;
    if (trendlineX > latestMoodTime) break;
    const mood = computeAverageMoodInInterval(
      moods,
      new Date(t0),
      new Date(t1)
    );
    if (mood !== undefined) trendlinePoints.push([trendlineX, mood]);
  }

  return trendlinePoints;
};

interface Props {
  fromDate: Date;
  hidePoints?: boolean;
  toDate: Date;
  xLabels: [number, string][];
  xLines?: number[];
}

export default function MoodChartForPeriod({
  fromDate,
  hidePoints = false,
  toDate,
  xLabels,
  xLines = xLabels.map(([x]) => x),
}: Props) {
  const moods = useSelector(normalizedMoodsSelector);
  const domain: [number, number] = [fromDate.getTime(), toDate.getTime()];
  const envelopingMoodIds = getEnvelopingMoodIds(
    moods.allIds,
    fromDate,
    toDate
  );
  const data: [number, number][] = envelopingMoodIds.map((id) => {
    const mood = moods.byId[id];
    return [new Date(id).getTime(), mood.mood];
  });

  return (
    <MoodChart
      data={data}
      domain={domain}
      hidePoints={hidePoints}
      trendlinePoints={computeTrendlinePoints(
        { ...moods, allIds: envelopingMoodIds },
        domain
      )}
      xLabels={xLabels}
      xLines={xLines}
    />
  );
}
