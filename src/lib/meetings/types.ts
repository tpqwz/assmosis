export type Gender = "ALL" | "MEN_ONLY" | "WOMEN_ONLY";
export type Platform =
  | "zoom"
  | "phone"
  | "email"
  | "jitsi"
  | "jami"
  | "telegram"
  | "whatsapp"
  | "meet"
  | "discord"
  | "signal"
  | "teams"
  | "skype"
  | "inperson"
  | "other";
export type Source = "catalog" | "custom";

export type Meeting = {
  id: string;
  name: string;
  weekday: number;
  hour: number;
  minute: number;
  zone: string;
  durationMinutes: number;
  platform: Platform;
  meetingId: string;
  password: string;
  joinUrl: string;
  notes: string;
  contactInfo: string;
  gender: Gender;
  source: Source;
  programId: string;
  groupId: string;
  language: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  tags?: string[];
};

export type MeetingDraft = Omit<Meeting, "id" | "source"> & {
  id?: string;
  source?: Source;
};

export type FellowshipGroup = {
  id: string;
  name: string;
  programId: string;
  notes: string;
  contactInfo: string;
  platform: Platform;
  joinUrl: string;
};

export type Filters = {
  q: string;
  day: string;
  who: string;
  platform: string;
  source: string;
  programs: string[];
  languages: string[];
  locations: string[];
  areas: string[];
  modes: string[];
  tags: string[];
  favorites: boolean;
  hideMissingPasscode: boolean;
  near: string;
  radiusKm: number;
  originLat: number | null;
  originLng: number | null;
};

export type TimeCategory =
  | "live"
  | "nextHour"
  | "restOfDay"
  | "tomorrow"
  | "thisWeek"
  | "upcoming";

export type ScheduledMeeting = Meeting & {
  nextOccurrence: number;
  category: TimeCategory;
  isLive: boolean;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  day: "",
  who: "",
  platform: "",
  source: "",
  programs: [],
  languages: [],
  locations: [],
  areas: [],
  modes: [],
  tags: [],
  favorites: false,
  hideMissingPasscode: false,
  near: "",
  radiusKm: 80,
  originLat: null,
  originLng: null,
};

export const WEEKDAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 7, short: "Sun", long: "Sunday" },
];

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Helsinki",
  "Europe/Moscow",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export function emptyDraft(zone = "America/New_York"): MeetingDraft {
  return {
    name: "",
    weekday: 1,
    hour: 19,
    minute: 0,
    zone,
    durationMinutes: 60,
    platform: "zoom",
    meetingId: "",
    password: "",
    joinUrl: "",
    notes: "",
    contactInfo: "",
    gender: "ALL",
    programId: "aca",
    groupId: "",
    language: "",
    location: "",
    tags: [],
  };
}
