import * as React from "react";
import { Pagination, Paper } from "eri";
import {
  mapRight,
  formatIsoDateInLocalTimezone,
  createDateFromLocalDateString,
} from "../../../utils";
import MoodCell from "./MoodCell";
import { Link } from "@reach/router";
import { formatWeekWithYear, WEEK_OPTIONS } from "../../../formatters";
import { normalizedAveragesByWeekSelector } from "../../../selectors";
import { useSelector } from "react-redux";
import startOfWeek from "date-fns/startOfWeek";

const MAX_WEEKS_PER_PAGE = 8;

export default function Weeks() {
  const normalizedAveragesByWeek = useSelector(
    normalizedAveragesByWeekSelector
  );
  const [page, setPage] = React.useState(0);

  const pageCount = Math.ceil(
    normalizedAveragesByWeek.allIds.length / MAX_WEEKS_PER_PAGE
  );
  const startIndex = Math.max(
    0,
    normalizedAveragesByWeek.allIds.length - MAX_WEEKS_PER_PAGE * (page + 1)
  );
  const endIndex =
    normalizedAveragesByWeek.allIds.length - MAX_WEEKS_PER_PAGE * page;

  return (
    <Paper>
      <h2>Weeks</h2>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Average mood</th>
          </tr>
        </thead>
        <tbody>
          {mapRight(
            normalizedAveragesByWeek.allIds.slice(startIndex, endIndex),
            (dateString) => {
              const week = createDateFromLocalDateString(dateString);
              const weekFormattedString = formatWeekWithYear(week);
              return (
                <tr key={weekFormattedString}>
                  <td>
                    <Link
                      to={`weeks/${formatIsoDateInLocalTimezone(
                        startOfWeek(week, WEEK_OPTIONS)
                      )}`}
                    >
                      {weekFormattedString}
                    </Link>
                  </td>
                  <MoodCell mood={normalizedAveragesByWeek.byId[dateString]} />
                </tr>
              );
            }
          )}
        </tbody>
      </table>
      <Pagination onChange={setPage} page={page} pageCount={pageCount} />
    </Paper>
  );
}
