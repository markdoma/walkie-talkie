import React, { useState, useEffect } from "react";
import { getTimeEntriesForUser, getAllTimeEntries } from "../constants";
import { getEmployeeShiftAtDate } from "../shiftHistoryApi";
import {
  TimeEntry,
  TimeEntryType,
  EmployeeDailyLog,
  TeamMember,
} from "../types";
import * as XLSX from "xlsx";

interface TimesheetsProps {
  isAdmin: boolean;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
}

const formatTime = (date: Date | null) =>
  date
    ? date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--";

const formatDuration = (ms: number) => {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
};

const convertMsToDecimal = (ms: number) => {
  if (ms <= 0) return "0.00";
  const totalHours = ms / (1000 * 60 * 60);
  return (Math.ceil(totalHours * 4) / 4).toFixed(2);
};

const SortIcon: React.FC<{ order: "asc" | "desc" | "none" }> = ({ order }) => {
  if (order === "none") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 inline-block ml-1 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    );
  }
  return order === "asc" ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

const Timesheets: React.FC<TimesheetsProps> = ({
  isAdmin,
  currentUser,
  teamMembers,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [dateRangeDisplay, setDateRangeDisplay] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const employeeNames = isAdmin ? teamMembers.map((m) => m.name) : [];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Helper functions for range
      const getWeekRange = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      };

      const getMonthRange = (date: Date) => {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      };

      // Use selectedDate for range calculation
      const baseDate = selectedDate || new Date();
      const { start, end } =
        period === "weekly" ? getWeekRange(baseDate) : getMonthRange(baseDate);
      const extendedStart = new Date(start);
      extendedStart.setDate(start.getDate() - 1);
      extendedStart.setHours(0, 0, 0, 0);
      const extendedEnd = new Date(end);
      extendedEnd.setDate(end.getDate() + 1);
      extendedEnd.setHours(23, 59, 59, 999);
      setDateRangeDisplay(
        `${start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`
      );

      const employeeMap = new Map(teamMembers.map((m) => [m.id, m.name]));
      const selectedEmployeeId = teamMembers.find(
        (m) => m.name === selectedEmployee
      )?.id;

      let sourceData: TimeEntry[];
      if (isAdmin) {
        if (selectedEmployee !== "all" && selectedEmployeeId) {
          sourceData = await getTimeEntriesForUser(
            selectedEmployeeId,
            extendedStart,
            extendedEnd
          );
        } else {
          sourceData = await getAllTimeEntries(extendedStart, extendedEnd);
        }
      } else {
        sourceData = await getTimeEntriesForUser(
          currentUser.id,
          extendedStart,
          extendedEnd
        );
      }

      // Group by employee and day, but pair clock-in/clock-out that cross midnight
      const grouped: { [key: string]: EmployeeDailyLog } = {};
      sourceData.forEach((entry) => {
        // Find the clock-in for this entry
        const getLocalDateString = (date: Date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;
        };
        let groupDate = getLocalDateString(entry.timestamp);
        // If clock-out, check if previous clock-in was before midnight
        if (entry.type === TimeEntryType.ClockOut) {
          const prevClockIn = sourceData.find(
            (e) =>
              e.employeeId === entry.employeeId &&
              e.type === TimeEntryType.ClockIn &&
              e.timestamp < entry.timestamp &&
              entry.timestamp.getTime() - e.timestamp.getTime() <
                36 * 60 * 60 * 1000 // less than 36 hours
          );
          if (prevClockIn) {
            groupDate = getLocalDateString(prevClockIn.timestamp);
          }
        }
        const key = isAdmin ? `${entry.employeeId}-${groupDate}` : groupDate;
        if (!grouped[key]) {
          grouped[key] = {
            employeeId: entry.employeeId,
            employeeName:
              (employeeMap.get(entry.employeeId) as string) || "Unknown",
            date: groupDate,
            day: entry.timestamp.toLocaleDateString("en-US", {
              weekday: "long",
            }),
            entries: [],
          };
        }
        grouped[key].entries.push(entry);
      });

      // Only show logs within the original range
      const dailyLogs = Object.values(grouped).filter((log) => {
        // Compare by local date string
        const logDate = log.date;
        const startLocal = `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        const endLocal = `${end.getFullYear()}-${String(
          end.getMonth() + 1
        ).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
        // Always show if log is in range and has at least one clock-in
        const hasClockIn = log.entries.some(
          (e) => e.type === TimeEntryType.ClockIn
        );
        if (isAdmin) {
          return logDate >= startLocal && logDate <= endLocal && hasClockIn;
        }
        const hasClockInOrOut = log.entries.some(
          (e) =>
            e.type === TimeEntryType.ClockIn ||
            e.type === TimeEntryType.ClockOut
        );
        return logDate >= startLocal && logDate <= endLocal && hasClockInOrOut;
      });

      // Calculate daily data using the shift in effect at the time of the first clock-in
      const shiftCache: { [employeeId: string]: { [date: string]: string } } =
        {};
      const data = await Promise.all(
        dailyLogs.map(async (log) => {
          const firstIn =
            log.entries.find((e) => e.type === TimeEntryType.ClockIn)
              ?.timestamp ?? null;
          const lastOut =
            [...log.entries]
              .reverse()
              .find((e) => e.type === TimeEntryType.ClockOut)?.timestamp ??
            null;
          const breakStarts = log.entries
            .filter((e) => e.type === TimeEntryType.BreakStart)
            .map((e) => e.timestamp);
          const breakEnds = log.entries
            .filter((e) => e.type === TimeEntryType.BreakEnd)
            .map((e) => e.timestamp);

          let breakDurationMs = 0;
          for (
            let i = 0;
            i < Math.min(breakStarts.length, breakEnds.length);
            i++
          ) {
            breakDurationMs +=
              breakEnds[i].getTime() - breakStarts[i].getTime();
          }

          // Get shift time for this employee at the date of firstIn (default 9:00AM)
          let shiftStr = "9:00 AM";
          if (firstIn) {
            const dateKey = firstIn.toISOString();
            if (
              shiftCache[log.employeeId] &&
              shiftCache[log.employeeId][dateKey]
            ) {
              shiftStr = shiftCache[log.employeeId][dateKey];
            } else {
              shiftStr = await getEmployeeShiftAtDate(log.employeeId, firstIn);
              if (!shiftCache[log.employeeId]) shiftCache[log.employeeId] = {};
              shiftCache[log.employeeId][dateKey] = shiftStr;
            }
          }
          let [shiftHour, shiftMinute] = [9, 0];
          if (shiftStr) {
            const match = shiftStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              shiftHour = parseInt(match[1], 10);
              shiftMinute = parseInt(match[2], 10);
              if (/PM/i.test(match[3]) && shiftHour !== 12) shiftHour += 12;
              if (/AM/i.test(match[3]) && shiftHour === 12) shiftHour = 0;
            }
          }
          const shiftStart = firstIn
            ? new Date(
                firstIn.getFullYear(),
                firstIn.getMonth(),
                firstIn.getDate(),
                shiftHour,
                shiftMinute,
                0
              )
            : null;
          const lateMs =
            firstIn && shiftStart && firstIn > shiftStart
              ? firstIn.getTime() - shiftStart.getTime()
              : 0;
          const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
          const adjustedLateMs = lateMs > gracePeriodMs ? lateMs : 0;
          const hoursWorkedMs =
            lastOut && firstIn
              ? lastOut.getTime() - firstIn.getTime() - breakDurationMs
              : 0;
          const eightHoursMs = 8 * 60 * 60 * 1000;
          const otHoursMs =
            hoursWorkedMs > eightHoursMs ? hoursWorkedMs - eightHoursMs : 0;

          return {
            ...(isAdmin && { employeeName: log.employeeName }),
            date: log.date,
            day: log.day,
            firstIn,
            lastOut,
            breakDuration: formatDuration(breakDurationMs),
            breakStart: breakStarts[0] ?? null,
            breakEnd: breakEnds[breakEnds.length - 1] ?? null,
            shiftStart,
            late: formatDuration(lateMs),
            adjustedLate: convertMsToDecimal(adjustedLateMs),
            hoursWorked: formatDuration(hoursWorkedMs),
            otHours: formatDuration(otHoursMs),
            adjustedOT: convertMsToDecimal(otHoursMs),
          };
        })
      );

      if (isAdmin && sortOrder !== "none") {
        data.sort((a, b) => {
          const nameA = a.employeeName.toUpperCase();
          const nameB = b.employeeName.toUpperCase();
          if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
          if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      } else {
        data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }

      setProcessedData(data);
      setIsLoading(false);
    };
    fetchData();
  }, [
    isAdmin,
    sortOrder,
    selectedEmployee,
    period,
    selectedDate,
    currentUser.id,
    teamMembers,
  ]);

  const handleSortByName = () => {
    setSortOrder((current) =>
      current === "none" ? "asc" : current === "asc" ? "desc" : "none"
    );
  };

  const baseColumns = [
    "Date",
    "First In",
    "Last Out",
    "Break",
    "Break Start",
    "Break End",
    "Shift Start",
    "Late",
    "Adjusted Late, hrs",
    "Hours Worked",
    "OT Hours",
    "Adjusted OT, hrs",
  ];
  const columns = isAdmin ? ["Employee", ...baseColumns] : baseColumns;

  // Export to Excel handler
  const handleExportExcel = () => {
    const header = columns;
    const rows = processedData.map((row) =>
      columns.map((col) => {
        switch (col) {
          case "Employee":
            return row.employeeName || "";
          case "Date":
            return row.date;
          case "First In":
            return row.firstIn
              ? new Date(row.firstIn).toLocaleTimeString()
              : "";
          case "Last Out":
            return row.lastOut
              ? new Date(row.lastOut).toLocaleTimeString()
              : "";
          case "Break":
            return row.breakDuration;
          case "Break Start":
            return row.breakStart
              ? new Date(row.breakStart).toLocaleTimeString()
              : "";
          case "Break End":
            return row.breakEnd
              ? new Date(row.breakEnd).toLocaleTimeString()
              : "";
          case "Shift Start":
            return row.shiftStart
              ? new Date(row.shiftStart).toLocaleTimeString()
              : "";
          case "Late":
            return row.late;
          case "Adjusted Late, hrs":
            return row.adjustedLate;
          case "Hours Worked":
            return row.hoursWorked;
          case "OT Hours":
            return row.otHours;
          case "Adjusted OT, hrs":
            return row.adjustedOT;
          default:
            return "";
        }
      })
    );
    const data = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
    XLSX.writeFile(
      wb,
      `timesheet_${dateRangeDisplay.replace(/\s|\//g, "_")}.xlsx`
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-main">
          {isAdmin ? "Team Timesheet" : "My Timesheet"}
        </h2>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Employees</option>
              {employeeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "weekly" | "monthly")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap flex items-center gap-2">
            {dateRangeDisplay}
            <button
              type="button"
              aria-label="Select date"
              className="ml-1 p-1 rounded hover:bg-gray-200"
              onClick={() => setShowCalendar((v) => !v)}
            >
              {/* Simple calendar icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                />
                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  strokeWidth="2"
                  stroke="currentColor"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  strokeWidth="2"
                  stroke="currentColor"
                />
                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  strokeWidth="2"
                  stroke="currentColor"
                />
              </svg>
            </button>
            {showCalendar && (
              <input
                type="date"
                className="ml-2 border rounded px-2 py-1 text-sm"
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value));
                  setShowCalendar(false);
                }}
                max={new Date().toISOString().slice(0, 10)}
                autoFocus
                onBlur={() => setShowCalendar(false)}
                style={{ zIndex: 10, position: "absolute" }}
              />
            )}
            <button
              type="button"
              onClick={handleExportExcel}
              className="ml-2 px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Export to Excel
            </button>
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b">
              {columns.map((col) => (
                <th
                  key={col}
                  className="p-3 text-sm font-semibold text-gray-600 tracking-wider"
                >
                  {isAdmin && col === "Employee" ? (
                    <button
                      onClick={handleSortByName}
                      className="flex items-center focus:outline-none font-semibold"
                    >
                      {col}
                      <SortIcon order={sortOrder} />
                    </button>
                  ) : (
                    col
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center p-6 text-gray-500"
                >
                  Loading data...
                </td>
              </tr>
            ) : processedData.length > 0 ? (
              processedData.map((row, index) => (
                <tr
                  key={`${row.date}-${row.employeeName || ""}-${index}`}
                  className="hover:bg-gray-50"
                >
                  {isAdmin && (
                    <td className="p-3">
                      <div className="font-medium text-text-main">
                        {row.employeeName}
                      </div>
                    </td>
                  )}
                  <td className="p-3">
                    <div className="font-medium text-text-main">
                      {new Date(row.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-text-secondary">{row.day}</div>
                  </td>
                  <td
                    className={`p-3 text-text-secondary ${
                      row.late !== "0m" ? "text-red-600 font-semibold" : ""
                    }`}
                  >
                    {formatTime(row.firstIn)}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {formatTime(row.lastOut)}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {row.breakDuration}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {formatTime(row.breakStart)}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {formatTime(row.breakEnd)}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {formatTime(row.shiftStart)}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      row.late !== "0m" ? "text-red-600" : "text-text-secondary"
                    }`}
                  >
                    {row.late}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      row.late !== "0m" ? "text-red-600" : "text-text-secondary"
                    }`}
                  >
                    {row.adjustedLate}
                  </td>
                  <td className="p-3 font-bold text-text-main">
                    {row.hoursWorked}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      row.otHours !== "0m"
                        ? "text-green-600"
                        : "text-text-secondary"
                    }`}
                  >
                    {row.otHours}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      row.otHours !== "0m"
                        ? "text-green-600"
                        : "text-text-secondary"
                    }`}
                  >
                    {row.adjustedOT}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center p-6 text-gray-500"
                >
                  No time entries found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timesheets;
