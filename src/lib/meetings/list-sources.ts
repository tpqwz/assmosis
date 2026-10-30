import type { Platform, Source } from "./types.ts";

/** A public page a catalog row was taken from. Nothing here is a guess. */
export type ListSource = { href: string; label: string };

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
const NA_VIRTUAL: ListSource = {
  href: "https://virtual-na.org/meetings/",
  label: "Virtual NA meeting list",
};
const AA_AU: ListSource = {
  href: "https://meetings.aa.org.au/",
  label: "AA meetings in Australia",
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
const SLAA_CAL: ListSource = {
  href: "https://teamup.com/ksxi176ztzzuswm5pk",
  label: "SLAA virtual intergroup calendar",
};
const UA_WORLD: ListSource = {
  href: "https://underearnersanonymous.org/meetings/?tsml-day=any",
  label: "Underearners Anonymous world list",
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
  alanon: { coverage: "all", sources: [ALANON] },
  alateen: { coverage: "all", sources: [ALANON] },
  na: { coverage: "some", sources: [NA_VIRTUAL] },
  aa: { coverage: "some", sources: [AA_AU] },
  ea: { coverage: "some", sources: [EA_REMOTE] },
  aca: { coverage: "some", sources: [ACA_CAL] },
  slaa: { coverage: "some", sources: [SLAA_UK, SLAA_CAL] },
  ua: { coverage: "some", sources: [UA_WORLD] },
};

const NONE: ProgramSources = { coverage: "none", sources: [] };

type Listed = {
  source?: Source | string;
  programId?: string;
  notes?: string;
  platform?: Platform | string;
};

/** Where this catalog row was listed. Custom meetings get nothing invented. */
export function meetingListSources(meeting: Listed): ListSource[] {
  if (meeting.source !== "catalog") return [];
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
      if (/DDA UK|Listed by DDA UK/i.test(notes)) return [DDA_UK];
      if (/Oregon/i.test(notes)) return [DDA_OREGON];
      return [];
    case "faa":
      if (meeting.platform === "phone") return [FAA_PHONE];
      if (/virtual/i.test(notes)) return [FAA_VIRTUAL];
      return [];
    case "coanon": {
      const region = notes.match(/Co-Anon,\s*([a-z ]+?)\./i)?.[1]?.toLowerCase() || "";
      const page = COANON_PAGES[region];
      return page ? [page] : [];
    }
    case "alanon":
    case "alateen":
      return /^\s*From the Al-Anon electronic meeting list/i.test(notes) ? [ALANON] : [];
    case "na":
      return /^\s*Virtual NA\b/i.test(notes) ? [NA_VIRTUAL] : [];
    case "aa":
      return /Adelaide AA|meetings\.aa\.org\.au/i.test(notes) ? [AA_AU] : [];
    case "ea":
      return /remote directory/i.test(notes) ? [EA_REMOTE] : [];
    case "aca":
      return /From the ACA World Service meeting list/i.test(notes) ? [ACA_CAL] : [];
    case "slaa":
      if (/From the SLAA UK online meeting list/i.test(notes)) return [SLAA_UK];
      if (/SLAA New Zealand online list/i.test(notes)) return [];
      return [SLAA_CAL];
    case "ua":
      return /Underearners Anonymous world list/i.test(notes) ? [UA_WORLD] : [];
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
