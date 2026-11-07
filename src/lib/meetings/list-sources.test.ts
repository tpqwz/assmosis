import assert from "node:assert/strict";
import { test } from "node:test";
import { meetingListSources, missingPageSentence, programListSources, programSourceLead } from "./list-sources.ts";
import { copySentence, listExpired, listWindow } from "./list-window.ts";

const row = (programId: string, notes = "", platform = "zoom", id = "") => ({
  source: "catalog" as const,
  programId,
  notes,
  platform,
  id,
});

test("whole-list pages attach to every row of that program", () => {
  assert.equal(meetingListSources(row("arts"))[0]?.href, "https://www.artsanonymous.org/newlist/master_list.html");
  assert.equal(meetingListSources(row("ceahow"))[0]?.href, "https://lahow.org/meetings.html");
  assert.equal(meetingListSources(row("aba")).length, 1);
  assert.equal(meetingListSources(row("recoveries")).length, 1);
  assert.equal(meetingListSources(row("eha")).length, 1);
  assert.equal(meetingListSources(row("gsa"))[0]?.href, "https://www.greysheet.org/meetings/find-a-meeting/");
  assert.equal(meetingListSources(row("fam"))[0]?.href, "https://familiesanonymous.org/meetings/meeting-directories/");
  assert.equal(programSourceLead("arts"), "Meetings in this list came from");
  assert.equal(programListSources("arts").coverage, "all");
  assert.equal(programListSources("gsa").coverage, "all");
});

test("split lists follow the note, the id, or the platform", () => {
  assert.match(meetingListSources(row("dda", "Online meeting on the Dual Diagnosis Anonymous of Oregon list."))[0].href, /ddainc\.org/);
  assert.match(meetingListSources(row("dda", "Listed by DDA UK at 19:00 Hours (GMT)."))[0].href, /ddauk\.org/);
  assert.match(meetingListSources(row("dda", "", "zoom", "dda-nc-1"))[0].href, /ddainc\.org/);
  assert.equal(meetingListSources(row("dda", "no page named")).length, 0);
  assert.match(meetingListSources(row("faa", "phone meeting", "phone"))[0].href, /phone-meetings/);
  assert.match(meetingListSources(row("faa", "", "zoom", "faa-zoom-1"))[0].href, /virtual-meetings/);
  assert.equal(meetingListSources(row("faa", "in person somewhere", "inperson")).length, 0);
  assert.equal(
    meetingListSources(row("coanon", "Co-Anon, south africa."))[0].href,
    "https://www.co-anon.org/meetings/south-africa",
  );
  assert.equal(meetingListSources(row("coanon", "Co-Anon, sweden.")).length, 0);
  assert.equal(programSourceLead("dda"), "Meetings in this list came from one of these pages");
});

test("a row links the list it was copied from, even when the note never names the page", () => {
  assert.equal(meetingListSources(row("na", "Last 15 minutes for parking lot", "zoom", "vna-6251")).length, 1);
  assert.equal(meetingListSources(row("na", "Last 15 minutes for parking lot")).length, 0);
  assert.match(meetingListSources(row("aa", "ID: 1", "zoom", "aa-ny-1"))[0].href, /nyintergroup\.org/);
  assert.match(meetingListSources(row("aa", "AA online.", "zoom", "aa-to-1"))[0].href, /aatoronto\.org/);
  assert.match(meetingListSources(row("aa", "AA online.", "zoom", "aa-nz-1"))[0].href, /aa\.org\.nz/);
  assert.match(meetingListSources(row("aa", "AA online.", "zoom", "aa-au-1"))[0].href, /meetings\.aa\.org\.au/);
  assert.equal(meetingListSources(row("aa", "AA online.")).length, 0);
  assert.equal(meetingListSources(row("aca", "Meeting ID: 123", "zoom", "aca-wso-1")).length, 1);
  assert.equal(meetingListSources(row("aca", "Meeting ID: 123", "zoom", "aca-1114-1")).length, 1);
  assert.equal(meetingListSources(row("aca", "Meeting ID: 123")).length, 0);
  assert.match(meetingListSources(row("slaa", "SLAA New Zealand online list."))[0].href, /slaa\.org\.nz\/zoom/);
  const virt = meetingListSources(row("slaa", "Inspiration line.", "zoom", "slaa-virt-1"));
  assert.equal(virt[0]?.label, "SLAA Virtual Intergroup on Teamup");
  assert.match(virt[0]?.detail || "", /copied from this calendar/);
  assert.match(virt[0]?.href, /teamup\.com\/ksxi176ztzzuswm5pk/);
  assert.equal(virt[1]?.href, "https://slaavirtual.org/meetingcalendar/");
  const fresh = meetingListSources(row("slaa", "", "zoom", "slaa-1114-1"));
  assert.equal(fresh[0]?.href, "https://teamup.com/ksxi176ztzzuswm5pk");
  assert.equal(fresh[1]?.href, "https://slaavirtual.org/meetingcalendar/");
  const itaa = meetingListSources(row("itaa", "", "zoom", "itaa-1114-1"));
  assert.equal(itaa[0]?.href, "https://internetaddictsanonymous.org/online-meetings/");
  assert.match(itaa[1]?.href, /teamup\.com\/ksahzu4xdr66wve679/);
  assert.equal(meetingListSources(row("sia", "", "zoom", "sia-davis-1"))[0]?.href, "https://siawso.org/meetings/");
  assert.equal(meetingListSources(row("itaa", "no calendar id")).length, 0);
  assert.equal(programSourceLead("na"), "Meetings in this list came from");
  assert.equal(programSourceLead("slaa"), "Meetings in this list came from one of these pages");
  assert.equal(programSourceLead("sia"), "Meetings in this list came from");
  assert.equal(programListSources("itaa").coverage, "all");
  assert.equal(programListSources("da").coverage, "none");
});

test("a meeting someone typed in gets no invented source", () => {
  assert.deepEqual(meetingListSources({ ...row("arts", "From the master list"), source: "custom" }), []);
  assert.deepEqual(meetingListSources({ source: "catalog", notes: "From the ACA World Service meeting list." }), []);
});

test("dated copies expire after their window, and a meeting someone added does not", () => {
  const after = Date.UTC(2026, 10, 6);
  assert.equal(listExpired(row("aca", "", "zoom", "aca-wso-1"), after), true);
  assert.equal(listExpired(row("aca", "From the ACA World Service meeting list.", "zoom", "aca-mx-1"), after), false);
  assert.equal(listExpired(row("slaa", "", "zoom", "slaa-virt-1"), after), true);
  assert.equal(listExpired(row("slaa", "", "zoom", "slaa-uk-1"), after), false);
  assert.equal(listExpired(row("slaa", "", "zoom", "slaa-nz-1"), after), false);
  assert.equal(listExpired(row("gsa", "", "zoom", "gsa-1"), after), true);
  assert.equal(listExpired({ ...row("gsa", "", "zoom", "gsa-1"), source: "custom" }, after), false);
  assert.equal(listExpired(row("fam", "", "zoom", "fam-us-1"), after), true);
  assert.equal(listExpired(row("fam", "", "zoom", "fam-intl-1"), after), true);
  assert.match(listWindow(row("slaa", "", "zoom", "slaa-virt-1"))?.label || "", /October 19/);
  assert.equal(listExpired(row("aca", "", "zoom", "aca-wso-1"), Date.UTC(2026, 9, 26, 12)), false);
  const november = "Copied from the ACA world calendar for November 7–14, 2026.";
  assert.equal(listExpired(row("aca", november, "zoom", "aca-wso-1"), Date.UTC(2026, 10, 7, 15)), false);
  assert.equal(listExpired(row("aca", november, "zoom", "aca-wso-1"), Date.UTC(2026, 10, 15)), true);
  assert.equal(listExpired(row("aca", "", "zoom", "aca-1114-1"), Date.UTC(2026, 10, 7)), false);
  assert.equal(listExpired(row("slaa", "", "zoom", "slaa-1114-1"), Date.UTC(2026, 10, 15)), true);
  assert.equal(listExpired(row("itaa", "", "zoom", "itaa-1114-1"), Date.UTC(2026, 10, 7)), false);
  assert.equal(listExpired(row("itaa", "", "zoom", "itaa-1114-1"), Date.UTC(2026, 10, 15)), true);
  const famNow = "From the Families Anonymous US and Canada virtual directory dated November 4, 2026.";
  assert.equal(listExpired(row("fam", famNow, "zoom", "fam-us-1"), Date.UTC(2026, 10, 7)), false);
  assert.equal(listExpired(row("fam", "", "zoom", "fam-us-1"), Date.UTC(2026, 10, 7)), true);
  assert.equal(listWindow(row("slaa", "", "zoom", "slaa-1114-1"))?.short, "Nov 7–14");
  assert.match(copySentence(row("slaa", "", "zoom", "slaa-1114-1"), Date.UTC(2026, 10, 7)), /Copied from the SLAA virtual intergroup calendar for November 7–14, 2026\.$/);
  assert.match(copySentence(row("slaa", "", "zoom", "slaa-virt-1"), Date.UTC(2026, 10, 7)), /October 19–26, 2026\. That date has passed\.$/);
  assert.equal(copySentence(row("arts")), "The day this row was copied was not saved.");
  assert.equal(copySentence({ ...row("arts"), source: "custom" }), "");
  assert.equal(missingPageSentence(row("aa", "AA online.")), "No public page was saved for this row.");
  assert.equal(missingPageSentence(row("aa", "", "zoom", "aa-ny-1")), "");
  assert.equal(missingPageSentence({ ...row("da"), source: "custom" }), "");
});
