export const FIELDS = [
  "ip",
  "first_seen_utc",
  "last_seen_utc",
  "hits",
  "country_code",
  "country",
  "region",
  "city",
  "last_path",
  "last_referer",
  "last_user_agent",
] as const;

export type VisitorField = (typeof FIELDS)[number];
export type VisitorRow = Record<VisitorField, string>;
