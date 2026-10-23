#!/usr/bin/env python3
"""Older Python fetcher. The portable program is tools/assmosis-lists.

    tools/assmosis-lists --list
    tools/assmosis-lists aca slaa ea ua -o meeting-updates

Sources live in tools/sources.json. A Teamup calendar or a Google Sheet tab
can be added there without changing this script. Import meetings.csv or
meetings.xlsx from Settings. Merge adds rooms you do not already have.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import date, datetime, timedelta
from html import unescape
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCES_PATH = Path(__file__).resolve().parent / "sources.json"
HEADERS = [
    "Name",
    "Weekday",
    "Time",
    "Timezone",
    "Duration Minutes",
    "Platform",
    "Meeting ID",
    "Password",
    "Join URL",
    "Notes",
    "Contact",
    "Gender",
    "Program",
    "Language",
    "Location",
]
WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DAYS = {name.lower(): index for index, name in enumerate(WEEKDAYS) if name}
UA = "Mozilla/5.0 (compatible; AssmosisMeetingFetch/1.0)"
ZONES = {
    "ET": "America/New_York", "EST": "America/New_York", "EDT": "America/New_York",
    "CT": "America/Chicago", "CST": "America/Chicago", "CDT": "America/Chicago",
    "MT": "America/Denver", "MST": "America/Denver", "MDT": "America/Denver",
    "PT": "America/Los_Angeles", "PST": "America/Los_Angeles", "PDT": "America/Los_Angeles",
    "GMT": "Etc/UTC", "UTC": "UTC", "UK": "Europe/London", "BST": "Europe/London",
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def strip_html(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value or "", flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{2,}", "\n", text).strip()


def clock(text: str):
    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)\b", text or "", re.I)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    meridiem = match.group(3).lower().replace(".", "").replace(" ", "")
    if meridiem == "pm" and hour != 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    if hour > 23 or minute > 59:
        return None
    return hour, minute


def safe_zone(name: str) -> str:
    name = ZONES.get((name or "").strip(), (name or "").strip())
    if not name:
        return ""
    try:
        ZoneInfo(name)
    except Exception:
        return ""
    return name


def human_pw(value: str) -> str:
    value = (value or "").strip().strip(".").strip("#")
    if not value or len(value) > 24:
        return ""
    if re.fullmatch(r"[A-Za-z0-9+/_.=-]{18,}", value):
        return ""
    if value.lower() in {"for", "the", "is", "required", "protected", "none", "optional"}:
        return ""
    return value


def zoom_ids(text: str) -> list[str]:
    found: list[str] = []
    for match in re.finditer(r"(?:https?://)?(?:[\w.-]+\.)?zoom\.us/j/(\d+)", text or "", re.I):
        found.append(match.group(1))
    for match in re.finditer(
        r"(?:zoom code|meeting id|zoom id|zoom)[:\s#]*((?:\d[\d ]{8,16}\d))",
        text or "",
        re.I,
    ):
        digits = re.sub(r"\D", "", match.group(1))
        if 9 <= len(digits) <= 12 and digits not in found:
            found.append(digits)
    return found


def password_from(text: str) -> str:
    match = re.search(
        r"(?:passcode|password)\s*(?:every day\s*)?(?:is|:)?\s*([A-Za-z0-9]{2,16})",
        text or "",
        re.I,
    )
    return human_pw(match.group(1)) if match else ""


def phone_from(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s().-]{8,}\d)", text or "")
    if not match:
        return ""
    digits = re.sub(r"\D", "", match.group(1))
    if len(digits) == 10:
        digits = "1" + digits
    return digits if 11 <= len(digits) <= 15 else ""


def gender_for(text: str) -> str:
    if re.search(r"\bwomen", text or "", re.I):
        return "WOMEN_ONLY"
    if re.search(r"\bmen(?:'s|’s)?\b|\bmen only\b", text or "", re.I):
        return "MEN_ONLY"
    return "ALL"


def language_for(text: str) -> str:
    for name in (
        "Spanish", "French", "German", "Portuguese", "Polish", "Russian",
        "Hebrew", "Arabic", "Japanese", "Italian", "Dutch", "Swedish",
    ):
        if re.search(name, text or "", re.I):
            return name
    return "English"


def teen(text: str) -> bool:
    return bool(re.search(r"\b(teen|alateen|narateen|s-ateen|gam-a-teen)\b", text or "", re.I))


def row(name, weekday, hour, minute, zone, duration, platform, meeting_id, password, join, notes, contact, gender, program, language, location):
    return {
        "Name": name[:120],
        "Weekday": WEEKDAYS[weekday],
        "Time": f"{hour:02d}:{minute:02d}",
        "Timezone": zone,
        "Duration Minutes": str(duration or 60),
        "Platform": platform,
        "Meeting ID": meeting_id,
        "Password": password,
        "Join URL": join,
        "Notes": (notes or "")[:1500],
        "Contact": (contact or "")[:240],
        "Gender": gender,
        "Program": program,
        "Language": language or "English",
        "Location": (location or "")[:160],
    }


def local_event(event: dict):
    start = datetime.fromisoformat(event["start_dt"])
    end = datetime.fromisoformat(event["end_dt"]) if event.get("end_dt") else start
    zone = safe_zone(event.get("tz") or "") or "America/New_York"
    local = start.astimezone(ZoneInfo(zone))
    minutes = int((end - start).total_seconds() // 60)
    if minutes <= 0 or minutes > 240:
        minutes = 60
    return local, zone, minutes


def from_teamup(spec: dict, start: date, end: date) -> list[dict]:
    url = (
        f"https://teamup.com/{spec['calendar']}/events"
        f"?startDate={start.isoformat()}&endDate={end.isoformat()}"
    )
    events = json.loads(fetch(url))["events"]
    groups = defaultdict(list)
    for event in events:
        groups[event.get("series_id") or event.get("id")].append(event)
    meetings = []
    program = spec["program"]
    for items in groups.values():
        base = max(items, key=lambda item: len(item.get("notes") or "") + len(item.get("location") or ""))
        notes = strip_html(base.get("notes") or "")
        location = (base.get("location") or "").strip()
        title = re.sub(r"\s+", " ", base.get("title") or program.upper()).strip()
        if teen(title):
            continue
        blob = "\n".join(part for part in (notes, location) if part)
        local, zone, duration = local_event(base)
        stated = re.search(
            r"Meeting'?s Local Time\s+\d{1,2}:\d{2}\s*[ap]m\s+([A-Za-z0-9_+/\-]+)",
            notes,
            re.I,
        )
        if stated and safe_zone(stated.group(1)):
            zone = safe_zone(stated.group(1))
        weekdays = []
        for item in items:
            instant = datetime.fromisoformat(item["start_dt"])
            weekdays.append(instant.astimezone(ZoneInfo(zone)).isoweekday())
            if item is base:
                local = instant.astimezone(ZoneInfo(zone))
        ids = zoom_ids(blob)
        password = password_from(blob)
        platform = meeting_id = join = ""
        place = "Online"
        if ids:
            meeting_id = ids[0]
            platform = "zoom"
            found = re.search(r"https?://(?:[\w.-]+\.)?zoom\.us/j/" + meeting_id + r"[^\s<\"']*", blob, re.I)
            join = found.group(0) if found else f"https://zoom.us/j/{meeting_id}"
            if password and "?" in join:
                join = join.split("?")[0]
            if re.search(r"hybrid", blob, re.I):
                place = "Hybrid"
        elif re.search(r"telephone|voip|phone|conference", blob, re.I):
            phone = phone_from(notes)
            if phone:
                platform = "phone"
                meeting_id = phone
                join = f"tel:+{phone}"
                place = "Telephone"
                code = re.search(r"(?:access code|conference code|pin)\s*[:# ]*\s*([0-9#]{3,12})", notes, re.I)
                if code and not password:
                    password = human_pw(code.group(1))
        if not platform:
            continue
        for weekday in sorted(set(weekdays)):
            meetings.append(row(
                title, weekday, local.hour, local.minute, zone, duration, platform,
                meeting_id, password, join, notes, "", gender_for(title + " " + notes[:240]),
                program, language_for(title + " " + notes[:400]), place,
            ))
    return meetings


def from_gsheets(spec: dict, start: date, end: date) -> list[dict]:
    del start, end
    meetings = []
    program = spec["program"]
    for gid in spec.get("gids") or []:
        url = f"https://docs.google.com/spreadsheets/d/{spec['spreadsheet']}/export?format=csv&gid={gid}"
        grid = list(csv.reader(fetch(url).decode("utf-8", "replace").splitlines()))
        meetings.extend(sheet_rows(grid, program, str(gid)))
    return meetings


def sheet_rows(grid: list[list[str]], program: str, gid: str) -> list[dict]:
    if not grid:
        return []
    fields: dict[str, list[str]] = {}
    current = None
    for raw in grid:
        label = (raw[0] if raw else "").strip()
        cells = raw[1:]
        if label:
            current = label
            fields[current] = cells
        elif current:
            previous = fields[current]
            for index, cell in enumerate(cells):
                if not cell.strip():
                    continue
                while len(previous) <= index:
                    previous.append("")
                previous[index] = (previous[index] + "\n" + cell).strip()
    header = grid[0][0].strip()
    header_l = header.lower()
    if "every day" in header_l:
        weekdays = list(range(1, 8))
    elif "weekday" in header_l:
        weekdays = list(range(1, 6))
    else:
        day = next((number for name, number in DAYS.items() if name in header_l), None)
        weekdays = [day] if day else []
    if not weekdays:
        return []
    time_row = fields.get(header) or grid[0][1:]
    names = fields.get("Group Name") or []
    out = []
    for index in range(max(len(time_row), len(names))):
        def cell(label: str) -> str:
            values = fields.get(label) or []
            return values[index].strip() if index < len(values) else ""

        name = cell("Group Name")
        when = time_row[index].strip() if index < len(time_row) else ""
        parsed = clock(when)
        if not name or not parsed:
            continue
        notes = cell("Notes")
        contact = cell("Group Contact")
        language = cell("Language (if not noted, in English)") or cell("Language") or "English"
        if "english" in language.lower():
            if "," in language:
                notes = (language.strip() + "\n" + notes).strip()
            language = "English"
        access = cell("Access Method")
        link = cell("Link")
        meeting = cell("Meeting ID")
        code = cell("Passcode") or cell("Access Code") or cell("Phone password")
        phone = cell("Phone Number") or cell("Phone #")
        interest = cell("Special Interest")
        based = cell("Based in")
        blob = " ".join(part for part in (name, access, notes, interest, when) if part)
        if teen(blob):
            continue
        zone = "America/Chicago"
        zone_match = re.search(r"\b(Eastern|Central|Mountain|Pacific|ET|CT|MT|PT|GMT|UK|London)\b", when, re.I)
        if zone_match:
            zone = {
                "eastern": "America/New_York", "et": "America/New_York",
                "central": "America/Chicago", "ct": "America/Chicago",
                "mountain": "America/Denver", "mt": "America/Denver",
                "pacific": "America/Los_Angeles", "pt": "America/Los_Angeles",
                "gmt": "Etc/UTC", "uk": "Europe/London", "london": "Europe/London",
            }.get(zone_match.group(1).lower(), zone)
        ids = zoom_ids(" ".join(part for part in (link, meeting, notes) if part))
        digits = re.sub(r"\D", "", meeting)
        zid = digits if 9 <= len(digits) <= 12 else (ids[0] if ids else "")
        password = human_pw(code)
        platform = meeting_id = join = ""
        if zid:
            platform, meeting_id = "zoom", zid
            join = link if link.startswith("http") else f"https://zoom.us/j/{zid}"
            if password and "?" in join:
                join = join.split("?")[0]
        elif re.sub(r"\D", "", phone):
            number = re.sub(r"\D", "", phone)
            if len(number) == 10:
                number = "1" + number
            platform, meeting_id, join = "phone", number, f"tel:+{number}"
        else:
            email = re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", contact)
            if email and re.search(r"contact|email|id number", notes + " " + access, re.I):
                platform, meeting_id, join = "email", email.group(0), f"mailto:{email.group(0)}"
        if not platform:
            continue
        span = re.search(
            r"(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?)",
            when,
            re.I,
        )
        duration = 60
        if span and clock(span.group(2)):
            stop = clock(span.group(2))
            start_clock = clock(span.group(1)) or parsed
            if stop and start_clock:
                minutes = (stop[0] * 60 + stop[1]) - (start_clock[0] * 60 + start_clock[1])
                if minutes <= 0:
                    minutes += 12 * 60
                if 15 <= minutes <= 180:
                    duration = minutes
        note = "\n".join(part for part in (notes, interest, f"Access: {access}" if access else "", based) if part)
        place = based or ("Telephone" if platform == "phone" else "Online")
        for weekday in weekdays:
            out.append(row(
                name, weekday, parsed[0], parsed[1], zone, duration, platform, meeting_id,
                password, join, note, contact, gender_for(name + " " + interest), program,
                language.strip() or "English", place,
            ))
    return out


KINDS = {"teamup": from_teamup, "gsheets": from_gsheets}


def dedupe(meetings: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for meeting in meetings:
        key = (
            meeting["Program"],
            meeting["Weekday"],
            meeting["Time"],
            meeting["Platform"],
            re.sub(r"\D", "", meeting["Meeting ID"]),
            meeting["Name"].lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(meeting)
    return out


def write_outputs(directory: Path, meetings: list[dict], report: list[str]) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    csv_path = directory / "meetings.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(meetings)
    db_path = directory / "meetings.sqlite"
    if db_path.exists():
        db_path.unlink()
    connection = sqlite3.connect(db_path)
    columns = ", ".join(f'"{name}" TEXT' for name in HEADERS)
    connection.execute(f"CREATE TABLE meetings ({columns})")
    placeholders = ", ".join("?" for _ in HEADERS)
    connection.executemany(
        f'INSERT INTO meetings VALUES ({placeholders})',
        [[meeting[name] for name in HEADERS] for meeting in meetings],
    )
    connection.execute("CREATE TABLE report (line TEXT)")
    connection.executemany("INSERT INTO report VALUES (?)", [(line,) for line in report])
    connection.commit()
    connection.close()
    xlsx_path = directory / "meetings.xlsx"
    script = Path(__file__).resolve().parent / "write-xlsx.mjs"
    try:
        subprocess.run(
            ["node", str(script), str(csv_path), str(xlsx_path)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        report.append("Excel file was not written: " + (error.stderr or error.stdout or "node failed").strip())
    (directory / "report.txt").write_text("\n".join(report) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch meeting lists into CSV, Excel, and SQLite for Assmosis.")
    parser.add_argument("programs", nargs="*", help="Source ids from tools/sources.json. Default: all.")
    parser.add_argument("-o", "--out", default="meeting-updates", help="Output folder.")
    parser.add_argument("--days", type=int, default=7, help="How many days of a calendar to read. Default 7.")
    parser.add_argument("--list", action="store_true", help="Show sources and exit.")
    args = parser.parse_args()
    sources = json.loads(SOURCES_PATH.read_text())
    if args.list:
        for key, spec in sources.items():
            print(f"{key:8} {spec.get('kind', '?'):8} {spec.get('label', '')}")
        return 0
    chosen = args.programs or list(sources)
    unknown = [name for name in chosen if name not in sources]
    if unknown:
        print("Unknown source: " + ", ".join(unknown), file=sys.stderr)
        print("Known: " + ", ".join(sources), file=sys.stderr)
        return 1
    start = date.today()
    end = start + timedelta(days=max(1, args.days))
    meetings = []
    report = [
        f"Fetched {datetime.now().isoformat(timespec='seconds')}",
        f"Window {start.isoformat()} through {end.isoformat()} for calendars.",
        "Import meetings.csv or meetings.xlsx from Settings. Use Merge.",
        "Merge skips a room you already saved and a room already in the shipped list.",
        "It does not remove a meeting that has left a website.",
        "",
    ]
    for name in chosen:
        spec = sources[name]
        kind = KINDS.get(spec.get("kind", ""))
        if not kind:
            report.append(f"{name}: skipped, unknown kind {spec.get('kind')}")
            continue
        try:
            found = kind(spec, start, end)
            meetings.extend(found)
            report.append(f"{name}: {len(found)} meetings — {spec.get('label', '')}")
        except Exception as error:
            report.append(f"{name}: failed — {error}")
    meetings = dedupe(meetings)
    report.append("")
    report.append(f"Total after removing duplicates: {len(meetings)}")
    write_outputs(Path(args.out), meetings, report)
    print("\n".join(report))
    print(f"Wrote {Path(args.out).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
