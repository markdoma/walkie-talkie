export type Page = "dashboard" | "timesheets" | "reports" | "settings";

export enum TimeEntryType {
  ClockIn = "Clock In",
  ClockOut = "Clock Out",
  BreakStart = "Break Start",
  BreakEnd = "Break End",
}

export interface TimeEntry {
  id: string;
  type: TimeEntryType;
  timestamp: Date;
  selfieUrl?: string;
  employeeId: string;
}

export enum TeamMemberStatus {
  In = "In",
  Out = "Out",
  OnBreak = "On Break",
}

export interface TeamMember {
  id: string;
  name: string;
  status: TeamMemberStatus;
  lastSeen?: string;
  shiftSchedule?: string;
  avatar?: string;
}

export interface DailyLog {
  date: string;
  day: string;
  entries: TimeEntry[];
}

export interface EmployeeDailyLog extends DailyLog {
  employeeName: string;
  employeeId: string;
}
