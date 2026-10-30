import assert from "node:assert/strict";
import { test } from "node:test";
import { meetingListSources, programListSources, programSourceLead } from "./list-sources.ts";

const row = (programId: string, notes = "", platform = "zoom") => ({
  source: "catalog" as const,
  programId,
  notes,
  platform,
});

test("whole-list pages attach to every row of that program", () => {
  assert.equal(meetingListSources(row("arts"))[0]?.href, "https://www.artsanonymous.org/newlist/master_list.html");
  assert.equal(meetingListSources(row("ceahow"))[0]?.href, "https://lahow.org/meetings.html");
  assert.equal(meetingListSources(row("aba")).length, 1);
  assert.equal(meetingListSources(row("recoveries")).length, 1);
  assert.equal(meetingListSources(row("eha")).length, 1);
  assert.equal(programSourceLead("arts"), "Meetings in this list came from");
  assert.equal(programListSources("arts").coverage, "all");
});

test("split lists follow the note or the platform, and skip what was not fetched", () => {
  assert.match(meetingListSources(row("dda", "Online meeting on the Dual Diagnosis Anonymous of Oregon list."))[0].href, /ddainc\.org/);
  assert.match(meetingListSources(row("dda", "Listed by DDA UK at 19:00 Hours (GMT)."))[0].href, /ddauk\.org/);
  assert.equal(meetingListSources(row("dda", "no page named")).length, 0);
  assert.match(meetingListSources(row("faa", "phone meeting", "phone"))[0].href, /phone-meetings/);
  assert.match(meetingListSources(row("faa", "virtual intergroup"))[0].href, /virtual-meetings/);
  assert.equal(meetingListSources(row("faa", "in person somewhere", "inperson")).length, 0);
  assert.equal(
    meetingListSources(row("coanon", "Co-Anon, south africa."))[0].href,
    "https://www.co-anon.org/meetings/south-africa",
  );
  assert.equal(meetingListSources(row("coanon", "Co-Anon, sweden.")).length, 0);
  assert.equal(programSourceLead("dda"), "Meetings in this list came from one of these pages");
  assert.equal(programSourceLead("coanon"), "Meetings in this list came from one of these pages");
});

test("partial lists only link the rows that name that page", () => {
  assert.equal(meetingListSources(row("na", "Virtual NA. Brazil Online.")).length, 1);
  assert.equal(meetingListSources(row("na", "Last 15 minutes for parking lot")).length, 0);
  assert.equal(meetingListSources(row("aa", "Adelaide AA. meetings.aa.org.au.")).length, 1);
  assert.equal(meetingListSources(row("aa", "AA online.", "zoom")).length, 0);
  assert.equal(meetingListSources(row("ea", "From the Emotions Anonymous International remote directory.")).length, 1);
  assert.equal(meetingListSources(row("ea", "EA phone meeting.")).length, 0);
  assert.equal(meetingListSources(row("aca", "From the ACA World Service meeting list.")).length, 1);
  assert.equal(meetingListSources(row("aca", "Meeting ID: 123")).length, 0);
  assert.match(meetingListSources(row("slaa", "From the SLAA UK online meeting list."))[0].href, /slaauk\.org/);
  assert.equal(meetingListSources(row("slaa", "SLAA New Zealand online list.")).length, 0);
  assert.match(meetingListSources(row("slaa", "Inspiration line."))[0].href, /teamup\.com\/ksxi176ztzzuswm5pk/);
  assert.equal(meetingListSources(row("ua", "Daily UA Skype meeting, printed on the Underearners Anonymous world list.")).length, 1);
  assert.equal(meetingListSources(row("ua", "Espresso Royale")).length, 0);
  assert.equal(meetingListSources(row("alanon", "From the Al-Anon electronic meeting list.")).length, 1);
  assert.equal(meetingListSources(row("alateen", "From the Al-Anon electronic meeting list. Contact 1: Marcela")).length, 1);
  assert.equal(programSourceLead("na"), "Some meetings in this list came from");
  assert.equal(programSourceLead("slaa"), "Some meetings in this list came from");
  assert.equal(programListSources("da").coverage, "none");
});

test("a meeting someone typed in gets no invented source", () => {
  assert.deepEqual(meetingListSources({ ...row("arts", "From the master list"), source: "custom" }), []);
  assert.deepEqual(meetingListSources({ source: "catalog", notes: "From the ACA World Service meeting list." }), []);
});
