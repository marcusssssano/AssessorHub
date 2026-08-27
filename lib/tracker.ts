export type TrackerType = "cssc" | "regular";

export const TRACKER_SETTINGS_ID: Record<TrackerType, string> = {
  cssc: "00000000-0000-0000-0000-000000000001",
  regular: "00000000-0000-0000-0000-000000000002",
};

export const TRACKER_DEFAULT_TITLE: Record<TrackerType, string> = {
  cssc: "CSSC Return Mail Tracker",
  regular: "Regular Return Mail Tracker",
};
