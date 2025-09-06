import React, { useState, useEffect } from "react";
import {
  TimeEntry,
  TimeEntryType,
  TeamMember,
  TeamMemberStatus,
} from "../types";
import Clock from "./dashboard/Clock";
import StatCard from "./dashboard/StatCard";
import TeamStatus from "./dashboard/TeamStatus";
import TimeLog from "./dashboard/TimeLog";
import ShiftManagement from "./dashboard/ShiftManagement";
import {
  addTimeEntry,
  getTimeEntriesForUser,
  getAllTimeEntries,
} from "../constants";

interface DashboardProps {
  isAdmin: boolean;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onAddEmployee: (employeeData: Pick<TeamMember, "name">) => void;
  onUpdateEmployee: (updatedEmployee: TeamMember) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  isAdmin,
  currentUser,
  teamMembers,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [timeLog, setTimeLog] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState("00:00:00");
  const [isLoadingLog, setIsLoadingLog] = useState(true);
  const [todayStatuses, setTodayStatuses] = useState<TeamMember[]>([]);

  // Helper to determine status from latest entry
  const getStatusFromEntries = (entries: TimeEntry[]): TeamMemberStatus => {
    if (!entries.length) return TeamMemberStatus.Out;
    const latest = entries[entries.length - 1];
    switch (latest.type) {
      case TimeEntryType.ClockIn:
        return TeamMemberStatus.In;
      case TimeEntryType.ClockOut:
        return TeamMemberStatus.Out;
      case TimeEntryType.BreakStart:
        return TeamMemberStatus.OnBreak;
      case TimeEntryType.BreakEnd:
        return TeamMemberStatus.In;
      default:
        return TeamMemberStatus.Out;
    }
  };

  // Fetch all team members' statuses for today
  const fetchTodayStatuses = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    try {
      const allEntries = await getAllTimeEntries(todayStart, todayEnd);
      const statusMap: { [id: string]: TeamMemberStatus } = {};
      teamMembers.forEach((member) => {
        const entries = allEntries.filter((e) => e.employeeId === member.id);
        statusMap[member.id] = getStatusFromEntries(entries);
      });
      setTodayStatuses(
        teamMembers.map((member) => ({
          ...member,
          status: statusMap[member.id],
        }))
      );
    } catch (error) {
      console.error("Failed to fetch team statuses:", error);
    }
  };

  const fetchTodaysLog = async () => {
    if (!currentUser) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
      setIsLoadingLog(true);
      const entries = await getTimeEntriesForUser(
        currentUser.id,
        todayStart,
        todayEnd
      );
      console.log("Fetched time entries:", entries); // Debug log
      setTimeLog(entries);
    } catch (error) {
      console.error("Failed to fetch time log:", error);
    } finally {
      setIsLoadingLog(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      fetchTodaysLog();
    } else {
      fetchTodayStatuses();
    }
  }, [isAdmin, currentUser, teamMembers]);

  const addTimeLogEntry = async (
    entry: Omit<TimeEntry, "id" | "employeeId">
  ) => {
    if (!currentUser) return;
    try {
      await addTimeEntry(currentUser.id, entry);
      await fetchTodaysLog(); // Re-fetch logs after adding a new one
    } catch (error) {
      console.error("Failed to add time entry:", error);
    }
  };

  if (isAdmin) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <ShiftManagement
            members={teamMembers}
            onAdd={onAddEmployee}
            onUpdate={onUpdateEmployee}
            onDelete={onDeleteEmployee}
          />
        </div>
        <div className="lg:col-span-1">
          <TeamStatus members={todayStatuses} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 lg:max-w-4xl lg:mx-auto">
      {/* Fix: Pass totalHours state to Clock component for display */}
      <Clock
        addTimeLogEntry={addTimeLogEntry}
        setTotalHours={setTotalHours}
        initialLog={timeLog}
        totalHours={totalHours}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          title="Hours Today"
          value={totalHours}
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
          title="Shift Starts"
          value="09:00 AM"
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
      </div>
      {isLoadingLog ? (
        <p>Loading activity...</p>
      ) : (
        <TimeLog entries={timeLog} />
      )}
    </div>
  );
};

export default Dashboard;
