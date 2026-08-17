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
  created_at: string;
  updated_at: string;
}
