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
