export interface Link {
  id: string;
  title: string;
  url: string;
  county: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteTemplate {
  id: string;
  collection: string;
  section: string | null;
  title: string;
  body: string;
  sort_order: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportDescription {
  id: string;
  activity_month: string;
  branch: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ReportEntry {
  id: string;
  activity_month: string;
  branch: string;
  reference_file: string | null;
  category: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackerBranch {
  id: string;
  name: string;
  sort_order: number;
  tracker_type: "cssc" | "regular";
  created_at: string;
  updated_at: string;
}

export interface TrackerDescription {
  id: string;
  activity_month: string;
  tracker_type: "cssc" | "regular";
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TrackerStatus {
  id: string;
  activity_month: string;
  branch_id: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackerSettings {
  id: string;
  title: string;
  updated_at: string;
}

export interface WorkLogEntry {
  id: string;
  entry_date: string;
  return_mail_count: number;
  completed_tasks: string | null;
  ongoing_tasks: string | null;
  next_tasks: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "Not Started" | "In Progress" | "Completed";

export interface TaskTrackerEntry {
  id: string;
  task: string;
  deadline: string;
  status: TaskStatus;
  note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
