import { aliasFor, aliasMatches } from "./i18n";

export type Program = {
  id: string;
  short: string;
  name: string;
  builtin?: boolean;
  section?: string;
  note?: string;
};

const A = "A–C";
const D = "D–G";
const H = "H–N";
const O = "O–R";
const S = "S–Z";
const HIST = "Older listing. Current meetings are not confirmed.";
const NET = "Related network, not its own fellowship.";

function row(section: string, id: string, short: string, name: string, note = ""): Program {
  return note ? { id, short, name, builtin: true, section, note } : { id, short, name, builtin: true, section };
}

export const BUILTIN_PROGRAMS: Program[] = [
  row(A, "abusealt", "Abuse Alt.", "Abuse Alternatives Anonymous", HIST),
  row(A, "art", "ART", "Academics Recovering Together", NET + " " + HIST),
  row(A, "ldsarp", "LDS ARP", "Addiction Recovery Program (Latter-day Saints)", "Church-based adaptation of the steps. " + NET),
  row(A, "aca", "ACA", "Adult Children of Alcoholics & Dysfunctional Families"),
  row(A, "acsa", "ACSA", "Adult Children of Sexual Abuse", HIST),
  row(A, "acsd", "ACSD", "Adult Children of Sexual Dysfunction", HIST),
  row(A, "ascaa", "ASCAA", "Adult Survivors of Child Abuse Anonymous"),
  row(A, "alanon", "Al-Anon", "Al-Anon Family Groups"),
  row(A, "alateen", "Alateen", "Alateen"),
  row(A, "aa", "AA", "Alcoholics Anonymous"),
  row(A, "aaa", "AAA", "All Addicts Anonymous", "AA adapted for any addiction. Phone and video meetings are on the fellowship site. The in-person list was registered in August 2020."),
  row(A, "aaagnostica", "Agnostica", "AA Agnostica", "Secular AA meetings and literature. Not a separate fellowship."),
  row(A, "aea", "AEA", "Addictive Eaters Anonymous"),
  row(A, "anesth", "Anesth.", "Anesthetists in Recovery", NET + " " + HIST),
  row(A, "anger", "Anger", "Anger Anonymous", "Not one verified independent fellowship. Anger-focused Emotions Anonymous meetings and a book use this name."),
  row(A, "aba", "ABA", "Anorexics and Bulimics Anonymous"),
  row(A, "arts", "ARTS", "ARTS Anonymous"),
  row(A, "benzo", "Benzos", "Benzodiazepines Anonymous", HIST),
  row(A, "bettors", "Bettors", "Bettors Anonymous", HIST),
  row(A, "bda", "BDA", "Business Debtors Anonymous", "A business focus inside Debtors Anonymous, not a separate fellowship."),
  row(A, "calix", "Calix", "Calix Society", "Catholic fellowship connected with alcoholism recovery. " + NET),
  row(A, "castimonia", "Castimonia", "Castimonia", "A Christian men's fellowship around sexual integrity. Not the Twelve Steps under another name."),
  row(A, "caregivers", "Caregivers", "Caregivers Anonymous", HIST),
  row(A, "cir", "CIR", "Catholic in Recovery", NET),
  row(A, "cr", "CR", "Celebrate Recovery", "Christian program for hurts, hang-ups, and habits. " + NET),
  row(A, "chapter9", "Ch. 9", "Chapter Nine", HIST),
  row(A, "cda", "CDA", "Chemically Dependent Anonymous", HIST),
  row(A, "cyea", "CYEA", "Children’s & Youth Emotions Anonymous", HIST),
  row(A, "cfs", "CFSA", "Chronic Fatigue Syndrome Anonymous", HIST),
  row(A, "cpa", "CPA", "Chronic Pain Anonymous"),
  row(A, "clergy", "Clergy", "Clergy Helping Clergy", NET + " " + HIST),
  row(A, "cla", "CLA", "Clutterers Anonymous"),
  row(A, "coanon", "Co-Anon", "Co-Anon Family Groups"),
  row(A, "coda", "CoDA", "Co-Dependents Anonymous"),
  row(A, "codahp", "CoDA HP", "Co-Dependents Anonymous for Helping Professionals", NET + " " + HIST),
  row(A, "ca", "CA", "Cocaine Anonymous"),
  row(A, "cva", "CVA", "Combat Veterans Anonymous", NET + " " + HIST),
  row(A, "ceahow", "CEA-HOW", "Compulsive Eaters Anonymous–H.O.W."),
  row(A, "stutter", "Stutter", "Compulsive Stutterers Anonymous", HIST),
  row(A, "convicts", "Convicts", "Convicts Anonymous", HIST),
  row(A, "cosa", "COSA", "COSA"),
  row(A, "coslaa", "COSLAA", "Co-Sex and Love Addicts Anonymous"),
  row(A, "cga", "C&G", "Criminals & Gangs Anonymous", HIST),
  row(A, "cma", "CMA", "Crystal Meth Anonymous"),
  row(D, "ddanon", "DD-Anon", "DD-Anon", HIST),
  row(D, "da", "DA", "Debtors Anonymous"),
  row(D, "dentists", "Dentists", "Dentists Concerned for Dentists", NET + " " + HIST),
  row(D, "depanon", "Dep-Anon", "Dep-Anon"),
  row(D, "depressed", "Depressed", "Depressed Anonymous"),
  row(D, "diabetics", "Diabetics", "Diabetics Anonymous", HIST),
  row(D, "disability", "Dis-Ability", "Dis-Ability Anonymous", HIST),
  row(D, "divorce", "Divorce", "Divorce Anonymous", HIST),
  row(D, "dva", "DVA", "Domestic Violence Anonymous", "Older listing with conflicting activity notes. Not confirmed as a current fellowship."),
  row(D, "dtr", "DTR", "Double Trouble in Recovery"),
  row(D, "drugsanon", "Drugs Anon.", "Drugs Anonymous", "Not another name for Narcotics Anonymous. " + HIST),
  row(D, "dda", "DDA", "Dual Diagnosis Anonymous"),
  row(D, "ddo", "DDO", "Dual Disorders Anonymous", HIST),
  row(D, "dra", "DRA", "Dual Recovery Anonymous"),
  row(D, "eatingadd", "Eating Add.", "Eating Addictions Anonymous", HIST),
  row(D, "eda", "EDA", "Eating Disorders Anonymous"),
  row(D, "eha", "EHA", "Emotional Health Anonymous"),
  row(D, "ea", "EA", "Emotions Anonymous"),
  row(D, "ethnic", "Ethnic", "Ethnic Anonymous", HIST),
  row(D, "fam", "Families", "Families Anonymous"),
  row(D, "fsoa", "FSOA", "Families of Sex Offenders Anonymous", HIST),
  row(D, "fosa", "FOSA", "Fear of Success Anonymous", HIST),
  row(D, "faa", "FAA", "Food Addicts Anonymous"),
  row(D, "fa", "FA", "Food Addicts in Recovery Anonymous"),
  row(D, "gamanon", "Gam-Anon", "Gam-Anon"),
  row(D, "gamateen", "Gam-A-Teen", "Gam-A-Teen"),
  row(D, "ga", "GA", "Gamblers Anonymous"),
  row(D, "gaa", "GAA", "Gaming Addicts Anonymous"),
  row(D, "gameranon", "Gamer-Anon", "Gamer-Anon", "Family and friends. Not the same list as Gaming Addicts Anonymous."),
  row(D, "gangs", "Gangs", "Gangs Anonymous", HIST),
  row(D, "grievers", "Grievers", "Grievers Anonymous", HIST),
  row(D, "gsa", "GSA", "GreySheeters Anonymous"),
  row(D, "grow", "GROW", "GROW", "Mental-health mutual help patterned partly after AA. Not the Twelve Steps under another name."),
  row(H, "ha", "HA", "Heroin Anonymous"),
  row(H, "hivies", "HIVIES", "HIVIES", HIST),
  row(H, "ibogaine", "Ibogaine", "Ibogaine Anonymous", "A niche listing. Not an endorsement of ibogaine treatment."),
  row(H, "isa", "ISA", "Incest Survivors Anonymous", "Not automatically the same as Survivors of Incest Anonymous. " + HIST),
  row(H, "icap", "ICAP", "Intercongregational Alcoholism Program", NET + " " + HIST),
  row(H, "idaa", "IDAA", "International Doctors in Alcoholics Anonymous", NET),
  row(H, "ilaa", "ILAA", "International Lawyers in Alcoholics Anonymous", NET),
  row(H, "nurses", "Nurses", "International Nurses Anonymous", NET + " " + HIST),
  row(H, "pharmacists", "Pharmacists", "International Pharmacists Anonymous", NET + " " + HIST),
  row(H, "itaa", "ITAA", "Internet and Technology Addicts Anonymous"),
  row(H, "jacs", "JACS", "Jewish Alcoholics, Chemically Dependent Persons and Significant Others", NET),
  row(H, "laa", "LAA", "Love Addicts Anonymous"),
  row(H, "lovenadd", "Love-N-Add.", "Love-N-Addiction", HIST),
  row(H, "lovers", "Lovers", "Lovers Anonymous", HIST),
  row(H, "ma", "MA", "Marijuana Anonymous"),
  row(H, "maranon", "Mar-Anon", "Mar-Anon", "Family and friends of people who use marijuana."),
  row(H, "maa", "MAA", "Media Addicts Anonymous"),
  row(H, "mira", "MIRA", "Mentally Ill Recovering Alcoholics", NET + " " + HIST),
  row(H, "methadone", "Methadone", "Methadone Anonymous", "Current meetings are not confirmed."),
  row(H, "naranon", "Nar-Anon", "Nar-Anon Family Groups"),
  row(H, "narateen", "Narateen", "Narateen"),
  row(H, "na", "NA", "Narcotics Anonymous"),
  row(H, "nta", "Neuróticos", "Neurotics Anonymous"),
  row(H, "nicanon", "Nic-Anon", "Nic-Anon", HIST),
  row(H, "nica", "NicA", "Nicotine Anonymous"),
  row(O, "oanon", "O-Anon", "O-Anon", HIST),
  row(O, "oca", "OCA", "Obsessive Compulsive Anonymous"),
  row(O, "olga", "OLGA", "On-Line Gamers Anonymous"),
  row(O, "olganon", "OLG-Anon", "OLG-Anon"),
  row(O, "overcomers", "Overcomers", "Overcomers Outreach", NET),
  row(O, "overcomersv", "Victory", "Overcomers–Victory Through Christ", NET + " " + HIST),
  row(O, "oa", "OA", "Overeaters Anonymous"),
  row(O, "pir", "PIR", "Pagans in Recovery", NET),
  row(O, "phobics", "Phobics", "Phobics Anonymous", NET + " " + HIST),
  row(O, "parn", "PA Recovery", "Physician Assistant Recovery Network", NET + " " + HIST),
  row(O, "pilladd", "Pill Add.", "Pill Addicts Anonymous", "Listed separately from Pills Anonymous. " + HIST),
  row(O, "pa", "PA", "Pills Anonymous"),
  row(O, "paa", "PAA", "Porn Addicts Anonymous"),
  row(O, "pornanon", "Porn Anon.", "Pornography Anonymous", "A separate published name from Porn Addicts Anonymous. Confirm which fellowship a meeting belongs to."),
  row(O, "rxanon", "Rx Anon.", "Prescriptions Anonymous", HIST),
  row(O, "pra", "PrA", "Procrastinators Anonymous"),
  row(O, "psychra", "PRA-P", "Psychiatrically Recovering Alcoholics", HIST),
  row(O, "psychologists", "Psychologists", "Psychologists Helping Psychologists", NET + " " + HIST),
  row(O, "rba", "R&B", "Racism & Bigotry Anonymous", "Not the same listing as Racists Anonymous. " + HIST),
  row(O, "racists", "Racists", "Racists Anonymous", "A step adaptation about the participant’s own racist attitudes, not a hate group."),
  row(O, "recoveries", "RcvA", "Recoveries Anonymous"),
  row(O, "rca", "RCA", "Recovering Couples Anonymous"),
  row(O, "relationships", "Relationships", "Relationships Anonymous", HIST),
  row(O, "repeat", "Repeat Off.", "Repeat-Offenders Anonymous", HIST),
  row(S, "samson", "Samson", "Samson Society", "A men's fellowship around honesty and unwanted sexual behavior. Not the Twelve Steps under another name."),
  row(S, "sanon", "S-Anon", "S-Anon"),
  row(S, "schizo", "SchizA", "Schizophrenics Anonymous", "Mutual-help fellowship that uses a six-step approach, not the classic Twelve Steps."),
  row(S, "sha", "SHA", "Self Harmers Anonymous", "Current meetings are not confirmed."),
  row(S, "sma", "SMA", "Self Mutilators Anonymous", "Current meetings are not confirmed."),
  row(S, "spaa", "SPAA", "Sex and Porn Addicts Anonymous"),
  row(S, "saa", "SAA", "Sex Addicts Anonymous"),
  row(S, "slaa", "SLAA", "Sex and Love Addicts Anonymous"),
  row(S, "sa", "SA", "Sexaholics Anonymous"),
  row(S, "sexabuse", "SASA", "Sexual Abuse Survivors Anonymous", HIST),
  row(S, "sara", "SARA", "Sexual Assault Recovery Anonymous", HIST),
  row(S, "sca", "SCA", "Sexual Compulsives Anonymous"),
  row(S, "sra", "SRA", "Sexual Recovery Anonymous"),
  row(S, "shoplifters", "Shoplifters", "Shoplifters Anonymous", HIST),
  row(S, "socialanx", "Social Anx.", "Social Anxiety Anonymous", "Uses “Twelve Gentle Steps.” Current meetings are not confirmed."),
  row(S, "socialworkers", "Social Workers", "Social Workers Helping Social Workers", NET + " " + HIST),
  row(S, "spenders", "Spenders", "Spenders Anonymous", HIST),
  row(S, "suicide", "Suicide", "Suicide Anonymous", "Peer support is not a substitute for crisis care. Current meetings are not confirmed."),
  row(S, "sia", "SIA", "Survivors of Incest Anonymous"),
  row(S, "t4anon", "T4-Anon", "T4-Anon", HIST),
  row(S, "therapists", "Therapists", "Therapists in Recovery", NET + " " + HIST),
  row(S, "tara", "TARA", "Total Aspects of Recovery Anonymous", HIST),
  row(S, "trauma", "Trauma", "Trauma Survivors Anonymous", HIST),
  row(S, "pacausus", "PA Caucus", "Twelve-Step Caucus of Physician Assistants", NET + " " + HIST),
  row(S, "ua", "UA", "Underearners Anonymous"),
  row(S, "unwed", "Unwed Parents", "Unwed Parents Anonymous", HIST),
  row(S, "va", "VA", "Violence Anonymous"),
  row(S, "wa", "WA", "Workaholics Anonymous"),
  row(S, "yea", "YEA", "Youth Emotions Anonymous", HIST),
  row(S, "other", "Other", "Another fellowship"),
];

export const PROGRAM_SECTIONS = [A, D, H, O, S];

export function programIdFromLabel(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "aca";
  const hit = BUILTIN_PROGRAMS.find((p) => {
    if (p.id === s || p.short.toLowerCase() === s || p.name.toLowerCase() === s) return true;
    return aliasMatches(p.id, s);
  });
  return hit?.id ?? "other";
}

export function localizedProgram(program: Program, locale: string): { short: string; name: string } {
  const alias = aliasFor(program.id, locale);
  return alias ?? { short: program.short, name: program.name };
}

export function programById(programs: Program[], id: string): Program | undefined {
  return programs.find((p) => p.id === id) ?? BUILTIN_PROGRAMS.find((p) => p.id === id);
}

/** Lists that would look finished if we only showed a number. */
export const LIST_SCOPE: Record<string, string> = {
  aa: "Virtual meetings from Australia, New Zealand, Toronto, New York, and Adelaide. Not every AA meeting.",
  na: "The Virtual NA region. Not every in-person room.",
  alanon: "Electronic meetings. Not every in-person group.",
  aca: "Online and telephone meetings from the ACA world calendar for November 7–14, 2026, plus meetings already saved. The November copy drops off after November 14. The October 19–26 copy has dropped off. Not every in-person group.",
  oa: "One Florida and Georgia intergroup. Not the Overeaters Anonymous list.",
  naranon: "Central California virtual meetings. Not the Nar-Anon list.",
  ca: "Cocaine Anonymous UK. Not every CA meeting.",
  slaa: "Three lists. The SLAA Virtual Intergroup calendar, copied for November 7–14, 2026, drops off after November 14. The October 19–26 copy has dropped off. The UK online list and the New Zealand online list stay. Not every in-person meeting.",
  depressed: "Journeys of Hope, the Blue Room, and a few other published rooms. Not every Depressed Anonymous meeting.",
  schizo: "A handful of Schizophrenia Alliance rooms. The room link is not public.",
  ea: "The Emotions Anonymous remote directory for 2026, plus meetings already saved. Checked again on November 7, 2026. A room that only says to email for the Zoom id is an email join.",
  grow: "A few published meetings. Not the GROW list.",
  saa: "Telemeetings, the UK, and Australia. Not every SAA meeting.",
  nta: "Published online meetings, mostly in Portuguese. Not every group.",
  alateen: "Only a couple of published meetings.",
  cir: "Published Catholic in Recovery virtual meetings.",
  ua: "The published UA world list, in every language on it, plus UK, Ireland, and Australia rooms that list does not include. Checked again on November 7, 2026. A face-to-face room marked inactive is left off. The daily Chinese Skype meeting printed on that listing is included.",
  bda: "English Business Debtors Anonymous meetings from the Debtors Anonymous list, including the Americas, the UK, and other English-speaking rooms. Not every in-person DA meeting.",
  aaa: "Phone and video meetings from the All Addicts Anonymous site, plus in-person groups last registered in August 2020. Confirm an in-person room before you go.",
  ha: "The Heroin Anonymous meeting table, in person and online. Confirm a room if the directions look old.",
  wa: "The Workaholics Anonymous world list. Languages are tagged. A room that only says to email for the Zoom link is an email join, not a map pin.",
  laa: "Love Addicts Anonymous video meetings, listed in Pacific time.",
  pa: "The Pills Anonymous virtual list. Not the in-person list.",
  paa: "Two Pill Addicts Anonymous meetings published on the Pills Anonymous virtual list. Not a separate PAA directory.",
  cpa: "Video meetings from the Chronic Pain Anonymous video page, including the German and French rooms. The phone page did not publish a schedule.",
  sca: "Sexual Compulsives Anonymous meetings whose detail page published a Zoom link. Not every SCA meeting. Times are what the page printed.",
  sa: "Sexaholics Anonymous meetings that publish a Zoom link. Not the in-person list. Closed and contact-only rooms without a link are not here.",
  dra: "Meetings published on the Dual Recovery Anonymous site. Online rooms with no join link were left off.",
  gsa: "GreySheeters meetings on the calendar for the week of October 18–25, 2026: Zoom, phone, hybrid, and in person. That week drops off after October 25. A weekly room shows up once. Phone PINs are often not on the page.",
  fam: "Families Anonymous virtual directories. The United States and Canada list dated November 4, 2026 is the current copy. The October 13, 2026 copy of that list, and the international virtual directory dated May 6, 2026, have dropped off. Not the in-person directories. Some rooms meet only once or twice a month.",
  nica: "Southern California Nicotine Anonymous video meetings. Not the world list. The world meeting finder did not publish a file we could read.",
  itaa: "Online meetings from the Internet and Technology Addicts Anonymous calendar for November 7–14, 2026 that publish a Zoom, phone, or chat link. That week drops off after November 14. A room with only a host email is left off. Not the in-person list.",
  sia: "The Survivors of Incest Anonymous meeting list, online and in person. A room that does not publish a time is left off. A room whose page says the meeting is closed is left off. If the list gives an email instead of a room link, the join is that email.",
  cla: "Three weekly Clutterers Anonymous UK meetings. The site lists one Zoom room for them. The world CLA calendar did not publish passcodes.",
  arts: "The ARTS Anonymous master list: phone, Zoom, Jitsi, Meet, Telegram, WebEx, and in person. A room that meets only twice a month says so in the notes. A face-to-face row with no street address is left off.",
  ceahow: "The CEA-HOW Los Angeles directory, including its phone bridge, Spanish electronic meetings, and the online rooms it lists outside Los Angeles. Checked again on November 7, 2026. Every time on that page is labeled Eastern, even when the address is in Los Angeles, and that is how it is stored. Not every in-person room in the world.",
  dda: "Online meetings from Dual Diagnosis Anonymous of Oregon, plus North Carolina, New Jersey, and Marysville rooms on that page, and DDA UK meetings whose clock is printed in GMT. Those pages were checked again on November 7, 2026. Friday at 10 am is left off because the page says it has no host. The monthly open mic is not a weekly meeting. Hawaii is marked on hold and is left off.",
  faa: "Food Addicts Anonymous virtual Zoom meetings and the phone list. Times are Eastern, as those pages print them. Not the in-person directory.",
  aba: "Meetings on the Anorexics and Bulimics Anonymous list, using the start time and time zone saved on each meeting. The website clock can change with your computer; these times do not. The Ab-Anon listing on that site is not included.",
  recoveries: "The Recoveries Anonymous women's phone meeting, Sunday through Friday at UK time, and two Zoom meetings that publish an Israel time. Face-to-face rooms and the Georgian contacts were left off because the page did not give a current time and a link.",
  eha: "Emotional Health Anonymous in the San Gabriel Valley. Virtual logins are not published; the join is an email to the intergroup. One meeting is in person.",
  coanon: "Co-Anon meetings whose region page published a time and a Zoom id or a street address: Arizona, Germany, Texas, Ontario, and South Africa. Texas is Eastern because that page says Eastern. The Ontario page names no zone, so it is stored as Eastern from the address. UK, Sweden, California, and the Netherlands only point at another site.",
  pra: "Procrastinators Anonymous says it is not hosting meetings.",
};
