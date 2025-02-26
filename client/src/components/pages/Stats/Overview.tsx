import { Link } from "@reach/router";
import { Paper, Spinner } from "eri";
import GetStartedCta from "../../shared/GetStartedCta";
import Months from "./Months";
import Weeks from "./Weeks";
import {
  eventsSelector,
  hasMeditationsSelector,
  normalizedMoodsSelector,
} from "../../../selectors";
import { useSelector } from "react-redux";
import Years from "./Years";
import MoodGradientForPeriod from "./MoodGradientForPeriod";
import { TEST_IDS } from "../../../constants";

export default function Overview() {
  const events = useSelector(eventsSelector);
  const moods = useSelector(normalizedMoodsSelector);
  const hasMeditations = useSelector(hasMeditationsSelector);

  if (!moods.allIds.length)
    return (
      <Paper.Group>
        <GetStartedCta />
      </Paper.Group>
    );

  if (!events.hasLoadedFromServer) return <Spinner />;

  return (
    <Paper.Group data-test-id={TEST_IDS.statsOverviewPage}>
      <Paper>
        <h2>Overview</h2>
        <MoodGradientForPeriod
          fromDate={new Date(moods.allIds[0])}
          toDate={new Date(moods.allIds[moods.allIds.length - 1])}
        />
      </Paper>
      <Weeks />
      <Months />
      <Years />
      <Paper>
        <h2>More</h2>
        <ul>
          {hasMeditations && (
            <li>
              <Link to="/stats/meditation">Meditation stats</Link>
            </li>
          )}
          <li>
            <Link to="/stats/explore">Explore</Link>
          </li>
        </ul>
      </Paper>
    </Paper.Group>
  );
}
