import { useSelector } from "react-redux";
import { normalizedAveragesByWeekSelector } from "../../../selectors";
import MoodSummaryForPeriod from "./MoodSummaryForPeriod";

interface Props {
  dates: [Date, Date, Date];
}

export default function MoodSummaryForWeek(props: Props) {
  const normalizedAverages = useSelector(normalizedAveragesByWeekSelector);

  return (
    <MoodSummaryForPeriod
      {...props}
      normalizedAverages={normalizedAverages}
      periodType="week"
    />
  );
}
