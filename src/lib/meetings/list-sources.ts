import type { Platform, Source } from "./types.ts";

/** A public page a catalog row was taken from. Nothing here is a guess. */
export type ListSource = { href: string; label: string; detail?: string };

export type ProgramSources = {
  coverage: "all" | "some" | "none";
  sources: ListSource[];
};

const ARTS: ListSource = {
  href: "https://www.artsanonymous.org/newlist/master_list.html",
  label: "ARTS Anonymous master list",
};
const CEAHOW: ListSource = {
  href: "https://lahow.org/meetings.html",
  label: "CEA-HOW Los Angeles meetings",
};
const ABA: ListSource = {
  href: "https://www.aba12steps.org/meeting-info",
  label: "Anorexics and Bulimics Anonymous meeting list",
};
const RECOVERIES: ListSource = {
  href: "https://www.r-a.org/H_Meet.htm",
  label: "Recoveries Anonymous meetings",
};
const EHA: ListSource = {
  href: "https://www.emotionalhealthanonymous.org/meetings",
  label: "Emotional Health Anonymous meetings",
};
const DDA_OREGON: ListSource = {
  href: "https://ddainc.org/online-dda-meetings/",
  label: "Dual Diagnosis Anonymous of Oregon online meetings",
};
const DDA_UK: ListSource = {
  href: "https://www.ddauk.org/meetings/",
  label: "DDA UK meetings",
};
const FAA_VIRTUAL: ListSource = {
  href: "https://faacanhelp.org/meetings/virtual-meetings/",
  label: "Food Addicts Anonymous virtual meetings",
};
const FAA_PHONE: ListSource = {
  href: "https://faacanhelp.org/meetings/phone-meetings/",
  label: "Food Addicts Anonymous phone meetings",
};
const ALANON: ListSource = {
  href: "https://meetings.al-anon.org/electronic-meeting-page/",
  label: "Al-Anon electronic meeting list",
};
const ALANON_AU: ListSource = {
  href: "https://al-anon.org.au/meetings/",
  label: "Al-Anon Australia meeting list",
};
const ALANON_UK: ListSource = {
  href: "https://al-anonuk.org.uk/getting-help/find-a-meeting/",
  label: "Al-Anon UK & Eire meeting finder",
};
const NA_VIRTUAL: ListSource = {
  href: "https://virtual-na.org/meetings/",
  label: "Virtual NA meeting list",
};
const AA_AU: ListSource = {
  href: "https://meetings.aa.org.au/",
  label: "AA meetings in Australia",
};
const AA_NZ: ListSource = {
  href: "https://aa.org.nz/aa-meetings/",
  label: "AA meetings in New Zealand",
};
const AA_NY: ListSource = {
  href: "https://www.nyintergroup.org/meetings/?tsml-attendance_option=online",
  label: "New York Intergroup online meetings",
};
const AA_TO: ListSource = {
  href: "https://www.aatoronto.org/meetings/",
  label: "Greater Toronto Area Intergroup meetings",
};
const EA_REMOTE: ListSource = {
  href: "https://emotionsanonymous.org/find-an-ea-meeting/remote/search-tool.html",
  label: "Emotions Anonymous remote directory",
};
const ACA_CAL: ListSource = {
  href: "https://adultchildren.org/virtual-meetings-calendar/",
  label: "ACA World Service online meetings calendar",
};
const SLAA_UK: ListSource = {
  href: "https://slaauk.org/meeting-list/online-meetings/",
  label: "SLAA UK online meetings",
};
const SLAA_NZ: ListSource = {
  href: "https://www.slaa.org.nz/zoom.html",
  label: "SLAA New Zealand online meetings",
};
const SLAA_PAGE: ListSource = {
  href: "https://slaavirtual.org/meetingcalendar/",
  label: "SLAA Virtual Intergroup meeting calendar",
  detail: "The same week, on the intergroup's own site.",
};
const SLAA_CAL: ListSource = {
  href: "https://teamup.com/ksxi176ztzzuswm5pk",
  label: "SLAA Virtual Intergroup on Teamup",
  detail: "These rooms were copied from this calendar. The intergroup publishes the week there.",
};
const UA_WORLD: ListSource = {
  href: "https://underearnersanonymous.org/meetings/?tsml-day=any",
  label: "Underearners Anonymous world list",
};
const GSA_CAL: ListSource = {
  href: "https://www.greysheet.org/meetings/find-a-meeting/",
  label: "GreySheeters Anonymous meeting calendar",
};
const FAM_DIRS: ListSource = {
  href: "https://familiesanonymous.org/meetings/meeting-directories/",
  label: "Families Anonymous meeting directories",
};
const ITAA_PAGE: ListSource = {
  href: "https://internetaddictsanonymous.org/online-meetings/",
  label: "Internet and Technology Addicts Anonymous online meetings",
};
const ITAA_CAL: ListSource = {
  href: "https://teamup.com/ksahzu4xdr66wve679",
  label: "The same calendar on Teamup",
};
const SIA_LIST: ListSource = {
  href: "https://siawso.org/meetings/",
  label: "Survivors of Incest Anonymous meeting list",
};

const COANON_PAGES: Record<string, ListSource> = {
  arizona: {
    href: "https://www.co-anon.org/meetings/arizona",
    label: "Co-Anon meetings in Arizona",
  },
  germany: {
    href: "https://www.co-anon.org/meetings/germany",
    label: "Co-Anon meetings in Germany",
  },
  texas: {
    href: "https://www.co-anon.org/meetings/texas",
    label: "Co-Anon meetings in Texas",
  },
  canada: {
    href: "https://www.co-anon.org/meetings/canada",
    label: "Co-Anon meetings in Canada",
  },
  "south africa": {
    href: "https://www.co-anon.org/meetings/south-africa",
    label: "Co-Anon meetings in South Africa",
  },
};

const PROGRAMS: Record<string, ProgramSources> = {
  arts: { coverage: "all", sources: [ARTS] },
  ceahow: { coverage: "all", sources: [CEAHOW] },
  aba: { coverage: "all", sources: [ABA] },
  recoveries: { coverage: "all", sources: [RECOVERIES] },
  eha: { coverage: "all", sources: [EHA] },
  dda: { coverage: "all", sources: [DDA_OREGON, DDA_UK] },
  faa: { coverage: "all", sources: [FAA_VIRTUAL, FAA_PHONE] },
  coanon: { coverage: "all", sources: Object.values(COANON_PAGES) },
  alanon: { coverage: "all", sources: [ALANON, ALANON_AU, ALANON_UK] },
  alateen: { coverage: "all", sources: [ALANON, ALANON_AU] },
  na: { coverage: "all", sources: [NA_VIRTUAL] },
  aa: { coverage: "all", sources: [AA_AU, AA_NZ, AA_NY, AA_TO] },
  ea: { coverage: "some", sources: [EA_REMOTE] },
  aca: { coverage: "some", sources: [ACA_CAL] },
  slaa: { coverage: "all", sources: [SLAA_CAL, SLAA_PAGE, SLAA_UK, SLAA_NZ] },
  ua: { coverage: "some", sources: [UA_WORLD] },
  gsa: { coverage: "all", sources: [GSA_CAL] },
  fam: { coverage: "all", sources: [FAM_DIRS] },
  itaa: { coverage: "all", sources: [ITAA_PAGE, ITAA_CAL] },
  sia: { coverage: "all", sources: [SIA_LIST] },
};

const NONE: ProgramSources = { coverage: "none", sources: [] };

type Listed = {
  id?: string;
  source?: Source | string;
  programId?: string;
  notes?: string;
  platform?: Platform | string;
};

/** Where this catalog row was listed. Custom meetings get nothing invented. */
export function meetingListSources(meeting: Listed): ListSource[] {
  if (meeting.source !== "catalog") return [];
  const id = meeting.id || "";
  const notes = meeting.notes || "";
  switch (meeting.programId) {
    case "arts":
      return [ARTS];
    case "ceahow":
      return [CEAHOW];
    case "aba":
      return [ABA];
    case "recoveries":
      return [RECOVERIES];
    case "eha":
      return [EHA];
    case "dda":
      if (id.startsWith("dda-uk-") || /DDA UK|Listed by DDA UK/i.test(notes)) return [DDA_UK];
      if (/^dda-(or|nc|nj|marysville)-/.test(id) || /Oregon/i.test(notes)) return [DDA_OREGON];
      return [];
    case "faa":
      if (id.startsWith("faa-phone-") || meeting.platform === "phone") return [FAA_PHONE];
      if (id.startsWith("faa-zoom-") || /virtual/i.test(notes)) return [FAA_VIRTUAL];
      return [];
    case "coanon": {
      const region = notes.match(/Co-Anon,\s*([a-z ]+?)\./i)?.[1]?.toLowerCase() || "";
      const page = COANON_PAGES[region];
      return page ? [page] : [];
    }
    case "alanon":
    case "alateen":
      if (id.startsWith("afg-au-")) {
        const slug = id.slice("afg-au-".length);
        return [{ href: `https://al-anon.org.au/meetings/${slug}/`, label: "Al-Anon Australia meeting list" }];
      }
      if (id.startsWith("afg-uk-")) {
        const slug = id.slice("afg-uk-".length).split("--")[0];
        return [{ href: `https://al-anonuk.org.uk/groups/${slug}/`, label: "Al-Anon UK & Eire meeting finder" }];
      }
      return id.startsWith("afg-") || /^\s*From the Al-Anon electronic meeting list/i.test(notes) ? [ALANON] : [];
    case "na":
      return id.startsWith("vna-") || /^\s*Virtual NA\b/i.test(notes) ? [NA_VIRTUAL] : [];
    case "aa":
      if (id.startsWith("aa-au-") || id.startsWith("adl-") || /Adelaide AA|meetings\.aa\.org\.au/i.test(notes)) return [AA_AU];
      if (id.startsWith("aa-nz-")) return [AA_NZ];
      if (id.startsWith("aa-ny-")) return [AA_NY];
      if (id.startsWith("aa-to-") || /aatoronto\.org\/meetings/i.test(notes)) return [AA_TO];
      return [];
    case "ea":
      return id.startsWith("ea-remote-") || /remote directory/i.test(notes) ? [EA_REMOTE] : [];
    case "aca":
      return id.startsWith("aca-wso-") || id.startsWith("aca-1114-") || /From the ACA World Service meeting list/i.test(notes)
        ? [ACA_CAL]
        : [];
    case "slaa":
      if (id.startsWith("slaa-uk-") || /From the SLAA UK online meeting list/i.test(notes)) return [SLAA_UK];
      if (id.startsWith("slaa-nz-") || /SLAA New Zealand online list/i.test(notes)) return [SLAA_NZ];
      if (id.startsWith("slaa-virt-") || id.startsWith("slaa-1114-")) return [SLAA_CAL, SLAA_PAGE];
      return [SLAA_CAL, SLAA_PAGE];
    case "itaa":
      return id.startsWith("itaa-1114-") || /Internet and Technology Addicts Anonymous online calendar/i.test(notes)
        ? [ITAA_PAGE, ITAA_CAL]
        : [];
    case "sia":
      return id.startsWith("sia-") || /Survivors of Incest Anonymous meeting list/i.test(notes) ? [SIA_LIST] : [];
    case "ua":
      return /Underearners Anonymous world list/i.test(notes) ? [UA_WORLD] : [];
    case "gsa":
      return [GSA_CAL];
    case "fam":
      return [FAM_DIRS];
    default:
      return [];
  }
}

/** Pages behind a program's shipped list. "all" means every catalog row has one. */
export function programListSources(programId: string): ProgramSources {
  return PROGRAMS[programId] ?? NONE;
}

export function programSourceLead(programId: string): string {
  const { coverage, sources } = programListSources(programId);
  if (!sources.length || coverage === "none") return "";
  if (coverage === "all" && sources.length === 1) return "Meetings in this list came from";
  if (coverage === "all") return "Meetings in this list came from one of these pages";
  return "Some meetings in this list came from";
}

export const NO_PAGE = "No public page was saved for this row.";

/** A catalog row with no known list page. Custom meetings stay quiet. */
export function missingPageSentence(meeting: Listed): string {
  if (meeting.source !== "catalog") return "";
  return meetingListSources(meeting).length ? "" : NO_PAGE;
}
