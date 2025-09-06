import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "./dashboard/StatCard";
import { getAllTimeEntries, getTimeEntriesForUser } from "../constants";
import {
  DailyLog,
  EmployeeDailyLog,
  TimeEntryType,
  TimeEntry,
  TeamMember,
} from "../types";

interface ReportData {
  totalHours: string;
  avgDailyHours: string;
  daysWorked: string;
  totalOvertime: string;
  chartData: { name: string; hours: number }[];
}

const processLogsForReports = (logs: TimeEntry[]): ReportData => {
  let totalHoursMs = 0;
  let totalOvertimeMs = 0;

  // Group by local date string
  const getLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const groupedByDay = logs.reduce((acc, entry) => {
    const date = getLocalDateString(entry.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as { [key: string]: TimeEntry[] });

  const daysWorked = Object.keys(groupedByDay).length;

  const dayMap: { [key: string]: string } = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  const weeklyBreakdown: { [key: string]: number } = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  Object.values(groupedByDay).forEach((entries) => {
    const firstIn =
      entries.find((e) => e.type === TimeEntryType.ClockIn)?.timestamp ?? null;
    const lastOut =
      [...entries].reverse().find((e) => e.type === TimeEntryType.ClockOut)
        ?.timestamp ?? null;

    const breakStarts = entries
      .filter((e) => e.type === TimeEntryType.BreakStart)
      .map((e) => e.timestamp);
    const breakEnds = entries
      .filter((e) => e.type === TimeEntryType.BreakEnd)
      .map((e) => e.timestamp);

    let breakDurationMs = 0;
    for (let i = 0; i < Math.min(breakStarts.length, breakEnds.length); i++) {
      breakDurationMs += breakEnds[i].getTime() - breakStarts[i].getTime();
    }

    const hoursWorkedMs =
      lastOut && firstIn
        ? lastOut.getTime() - firstIn.getTime() - breakDurationMs
        : 0;

    const eightHoursMs = 8 * 60 * 60 * 1000;
    const otHoursMs =
      hoursWorkedMs > eightHoursMs ? hoursWorkedMs - eightHoursMs : 0;

    totalHoursMs += hoursWorkedMs;
    totalOvertimeMs += otHoursMs;

    if (entries.length > 0) {
      const dayName = entries[0].timestamp.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayKey = dayMap[dayName];
      if (dayKey) {
        weeklyBreakdown[dayKey] += hoursWorkedMs / (1000 * 60 * 60); // convert to hours
      }
    }
  });

  const avgDailyHoursMs = daysWorked > 0 ? totalHoursMs / daysWorked : 0;

  const formatDurationForStats = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const chartData = Object.entries(weeklyBreakdown).map(([name, hours]) => ({
    name,
    hours: parseFloat(hours.toFixed(2)),
  }));

  return {
    totalHours: formatDurationForStats(totalHoursMs),
    avgDailyHours: formatDurationForStats(avgDailyHoursMs),
    daysWorked: daysWorked.toString(),
    totalOvertime: formatDurationForStats(totalOvertimeMs),
    chartData,
  };
};

const initialReportData: ReportData = {
  totalHours: "0h 0m",
  avgDailyHours: "0h 0m",
  daysWorked: "0",
  totalOvertime: "0h 0m",
  chartData: [
    { name: "Mon", hours: 0 },
    { name: "Tue", hours: 0 },
    { name: "Wed", hours: 0 },
    { name: "Thu", hours: 0 },
    { name: "Fri", hours: 0 },
    { name: "Sat", hours: 0 },
    { name: "Sun", hours: 0 },
  ],
};

interface ReportsProps {
  isAdmin: boolean;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
}

const Reports: React.FC<ReportsProps> = ({
  isAdmin,
  currentUser,
  teamMembers,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [reportData, setReportData] = useState<ReportData>(initialReportData);
  const [dateRangeDisplay, setDateRangeDisplay] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const employeeNames = isAdmin ? teamMembers.map((m) => m.name) : [];

  // Export to Excel handler (now inside component)
  const handleExportExcel = () => {
    const data = [
      ["Period", dateRangeDisplay],
      ["Total Hours", reportData.totalHours],
      ["Avg. Daily Hours", reportData.avgDailyHours],
      ["Days Worked", reportData.daysWorked],
      ["Total Overtime", reportData.totalOvertime],
      [],
      ["Day", "Hours Worked"],
      ...reportData.chartData.map((row) => [row.name, row.hours]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(
      wb,
      `report_${dateRangeDisplay.replace(/\s|\//g, "_")}.xlsx`
    );
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
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

      const selectedEmployeeId = teamMembers.find(
        (m) => m.name === selectedEmployee
      )?.id;

      let sourceData: TimeEntry[];
      if (isAdmin) {
        if (selectedEmployee !== "all" && selectedEmployeeId) {
          sourceData = await getTimeEntriesForUser(
            selectedEmployeeId,
            start,
            end
          );
        } else {
          sourceData = await getAllTimeEntries(start, end);
        }
      } else {
        sourceData = await getTimeEntriesForUser(currentUser.id, start, end);
      }

      if (sourceData.length > 0) {
        const data = processLogsForReports(sourceData);
        setReportData(data);
      } else {
        setReportData(initialReportData);
      }
    };

    fetchAndProcessData();
  }, [
    isAdmin,
    selectedEmployee,
    period,
    selectedDate,
    currentUser.id,
    teamMembers,
  ]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-text-main">
            {isAdmin ? "Team Reports" : "My Reports"}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Export to Excel
            </button>
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
              onChange={(e) =>
                setPeriod(e.target.value as "weekly" | "monthly")
              }
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
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Hours"
          value={reportData.totalHours}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="text-blue-500"
        />
        <StatCard
          title="Avg. Daily Hours"
          value={reportData.avgDailyHours}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          color="text-indigo-500"
        />
        <StatCard
          title="Days Worked"
          value={reportData.daysWorked}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          color="text-green-500"
        />
        <StatCard
          title="Total Overtime"
          value={reportData.totalOvertime}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          }
          color="text-purple-500"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-text-main mb-6">
          Weekly Hours Breakdown
        </h3>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={reportData.chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={false}
              />
              <YAxis
                unit="h"
                tick={{ fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="hours"
                fill="#4f46e5"
                name="Hours Worked"
                barSize={40}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
