#!/usr/bin/env python3
"""Pull published schedules for fellowships that were still empty.

Reads the sites directly. Does not invent a room, a time, or a passcode.
Skips teen meetings. Weekly rows only; a meeting that meets twice a month
keeps that fact in the notes.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}
WEEK = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
ZONES = {
    "et (us)": "America/New_York",
    "ct (us)": "America/Chicago",
    "pt (us)": "America/Los_Angeles",
    "mountain standard time (mst)": "America/Phoenix",
    "mountain standard time": "America/Phoenix",
    "mst (arizona)": "America/Phoenix",
    "central european summer time": "Europe/Berlin",
    "central european time": "Europe/Berlin",
    "central european": "Europe/Berlin",
    "eastern european": "Europe/Athens",
    "australian eastern": "Australia/Sydney",
    "british summer time": "Europe/London",
    "greenwich": "Europe/London",
    "eastern": "America/New_York",
    "central": "America/Chicago",
    "pacific": "America/Los_Angeles",
    "mountain": "America/Denver",
    "et": "America/New_York",
    "ct": "America/Chicago",
    "mt": "America/Denver",
    "mst": "America/Denver",
    "pt": "America/Los_Angeles",
    "pst": "America/Los_Angeles",
    "pdt": "America/Los_Angeles",
    "gmt": "Europe/London",
    "uk": "Europe/London",
    "bst": "Europe/London",
    "london": "Europe/London",
    "cet": "Europe/Berlin",
    "eet": "Europe/Athens",
    "aet": "Australia/Sydney",
    "msk": "Europe/Moscow",
    "israel": "Asia/Jerusalem",
    "jerusalem": "Asia/Jerusalem",
    "south africa standard time (sast)": "Africa/Johannesburg",
    "south africa standard time": "Africa/Johannesburg",
    "sast": "Africa/Johannesburg",
}
LANGS = {
    "english": "English", "spanish": "Spanish", "espanol": "Spanish", "español": "Spanish",
    "french": "French", "german": "German", "portuguese": "Portuguese", "polish": "Polish",
    "russian": "Russian", "hebrew": "Hebrew", "farsi": "Persian", "persian": "Persian",
    "italian": "Italian", "dutch": "Dutch", "swedish": "Swedish", "chinese": "Chinese",
    "japanese": "Japanese", "arabic": "Arabic", "georgian": "Georgian",
}


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(request, timeout=45) as response:
        raw = response.read()
    return raw.decode("utf-8", "replace")


def clean(value: str) -> str:
    value = unescape(value or "")
    value = value.replace("\xa0", " ").replace("\u200b", "").replace("\r", " ")
    return re.sub(r"\s+", " ", value).strip()


def text_of(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    html = re.sub(r"<svg[\s\S]*?</svg>", " ", html, flags=re.I)
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    html = re.sub(r"</(p|div|li|tr|h[1-6]|td|th)>", "\n", html, flags=re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    html = unescape(html).replace("\xa0", " ").replace("\r", "")
    html = re.sub(r"[ \t]+", " ", html)
    html = re.sub(r" *\n *", "\n", html)
    return html.strip()


def teen(value: str) -> bool:
    return bool(re.search(r"\b(alateen|narateen|s-ateen|sateen|gam-a-teen|gamateen)\b|\bteen\b", value or "", re.I))


def gender_for(value: str) -> str:
    if re.search(r"\bwomen|\bfemale\b", value or "", re.I):
        return "WOMEN_ONLY"
    if re.search(r"\bmen(?:'s|’s)?\b|\bmale\b", value or "", re.I):
        return "MEN_ONLY"
    return "ALL"


def human_pw(value: str) -> str:
    value = clean(value).strip(".#")
    if re.fullmatch(r"[\d ]+", value or "") and " " in value:
        value = value.replace(" ", "")
    if not value or len(value) > 24:
        return ""
    if re.search(r"\b(contact|email|call|text)\b", value, re.I):
        return ""
    if re.fullmatch(r"[A-Za-z0-9+/_.=-]{18,}", value):
        return ""
    if value.lower() in {
        "for", "the", "is", "required", "protected", "none", "optional", "link",
        "not provided", "n/a", "na", "no", "none needed", "no passcode", "nopasscode",
    }:
        return ""
    return value


def zone_for(label: str) -> str:
    key = clean(label).lower()
    if key in ZONES:
        return ZONES[key]
    for name, zone in sorted(ZONES.items(), key=lambda item: len(item[0]), reverse=True):
        if name and name in key:
            return zone
    return ""


def clock(text: str):
    match = re.search(
        r"(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?(?:\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?)?",
        text or "",
        re.I,
    )
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    start_mer = (match.group(3) or "").lower().replace(".", "")
    end_hour = int(match.group(4)) if match.group(4) else None
    end_mer = (match.group(6) or "").lower().replace(".", "")
    meridiem = start_mer or end_mer
    # "11:00-12:00 PM" means 11:00 in the morning through noon, not 11 at night.
    if not start_mer and end_mer.startswith("p") and end_hour == 12 and 8 <= hour <= 11:
        meridiem = "am"
    if not meridiem:
        return None
    if meridiem.startswith("p") and hour != 12:
        hour += 12
    if meridiem.startswith("a") and hour == 12:
        hour = 0
    if hour > 23 or minute > 59:
        return None
    return hour, minute


def duration_of(text: str, start):
    match = re.search(
        r"(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?",
        text or "",
        re.I,
    )
    if not match or not start:
        return 60
    end_mer = match.group(6) or match.group(3) or ""
    end = clock(f"{match.group(4)}:{match.group(5) or '00'} {end_mer}")
    if not end:
        return 60
    minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
    if minutes <= 0:
        minutes += 12 * 60
    return minutes if 15 <= minutes <= 240 else 60


def phone_digits(value: str, country: str = "") -> str:
    codes = {
        "france": "33", "germany": "49", "israel": "972", "ireland": "353",
        "uk": "44", "united kingdom": "44",
    }
    cc = codes.get(clean(country).lower(), "")
    chunks = re.findall(r"\+?\d[\d\-\s().]{6,}\d", value or "") or [value or ""]
    for chunk in chunks:
        digits = re.sub(r"\D", "", chunk)
        if digits.startswith("00"):
            digits = digits[2:]
        if digits.startswith("0") and cc:
            digits = cc + digits[1:]
        elif len(digits) == 9 and cc == "33":
            digits = "33" + digits
        elif len(digits) == 10 and not digits.startswith("0"):
            digits = "1" + digits
        if 10 <= len(digits) <= 15:
            return digits
    return ""


def slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return value[:48] or "meeting"


def row(**fields):
    meeting = {
        "id": fields["id"],
        "name": clean(fields["name"])[:120],
        "weekday": fields["weekday"],
        "hour": fields["hour"],
        "minute": fields["minute"],
        "zone": fields["zone"],
        "durationMinutes": fields.get("duration") or 60,
        "platform": fields["platform"],
        "meetingId": clean(fields.get("meeting_id") or "")[:240],
        "password": human_pw(fields.get("password") or ""),
        "joinUrl": clean(fields.get("join") or "")[:500],
        "notes": clean(fields.get("notes") or "")[:1500],
        "contactInfo": clean(fields.get("contact") or "")[:240],
        "gender": fields.get("gender") or "ALL",
        "programId": fields["program"],
        "language": fields.get("language") or "English",
        "location": clean(fields.get("location") or "")[:160],
        "lat": fields.get("lat"),
        "lng": fields.get("lng"),
        "tags": [],
    }
    if meeting["lat"] is None:
        meeting["lat"] = None
    if meeting["lng"] is None:
        meeting["lng"] = None
    if teen(meeting["name"] + " " + meeting["notes"]):
        return None
    if not (1 <= meeting["weekday"] <= 7):
        return None
    if not meeting["name"] or not meeting["zone"] or not meeting["platform"]:
        return None
    try:
        ZoneInfo(meeting["zone"])
    except Exception:
        return None
    return meeting


def expand_days(raw: str):
    original = clean(raw)
    lowered = original.lower()
    note = ""
    if re.search(r"1st|2nd|3rd|4th|first|second|third", lowered):
        note = "Listed as " + original + ", not every week."
    full = [
        ("monday", 1), ("tuesday", 2), ("wednesday", 3), ("thursday", 4),
        ("friday", 5), ("saturday", 6), ("sunday", 7),
    ]
    found = []
    scratch = lowered
    for name, number in full:
        if name in scratch:
            found.append(number)
            scratch = scratch.replace(name, " ")
    shorts = {"mon": 1, "tue": 2, "tues": 2, "wed": 3, "thu": 4, "thur": 4, "thurs": 4, "fri": 5, "sat": 6, "sun": 7}
    for token in re.findall(r"[a-z]+", scratch):
        if token in shorts:
            found.append(shorts[token])
    found = sorted(set(found))
    if len(found) == 2 and re.search(r"-|thru|through|to", lowered):
        start, stop = found
        if start <= stop:
            found = list(range(start, stop + 1))
        elif stop == 7:
            found = list(range(start, 8))
    return found, note


def from_arts() -> list:
    html = fetch("https://www.artsanonymous.org/newlist/master_list.html")
    meetings = []
    for tr in re.findall(r"<tr[\s\S]*?</tr>", html, re.I):
        cells = re.findall(r"<td[\s\S]*?</td>", tr, re.I)
        if len(cells) < 9:
            continue
        parsed = []
        for cell in cells:
            href = re.search(r'href="([^"]+)"', cell)
            parsed.append((clean(text_of(cell)), unescape(href.group(1)) if href else ""))
        kind, day, when, zone_label, language, country, name, theme, access, code = [item[0] for item in parsed[:10]]
        link = parsed[10][1] if len(parsed) > 10 else parsed[9][1]
        if not day or kind.upper().startswith("MEETING"):
            continue
        if kind.upper() in {"STEPS", "GENERAL TOPIC MEETINGS"} and not when:
            continue
        if not name:
            if theme and len(clean(theme)) > 12:
                name = theme
            elif "PERSON" in kind.upper() and re.search(r"\d", access or ""):
                name = "ARTS, " + clean(access)[:60]
            else:
                name = "ARTS Anonymous"
        days, cadence = expand_days(day)
        start = clock(when)
        zone = zone_for(zone_label)
        if not days or not start or not zone:
            continue
        blob = " ".join([kind, name, theme, access, country, language])
        platform = meeting_id = join = ""
        password = human_pw(code)
        zoom = re.search(r"zoom\.us/j/(\d+)", link + " " + access, re.I)
        if "ZOOM" in kind.upper() or zoom:
            digits = zoom.group(1) if zoom else re.sub(r"\D", "", access)
            if not (9 <= len(digits) <= 12):
                continue
            platform, meeting_id = "zoom", digits
            join = link if link.startswith("http") else f"https://zoom.us/j/{digits}"
            if password:
                join = join.split("?")[0]
        elif "@" in access and not phone_digits(access, country):
            address = access.split()[0]
            platform, meeting_id, join = "email", address, f"mailto:{address}"
        elif "PHONE" in kind.upper():
            number = phone_digits(access, country)
            if not number:
                continue
            platform, meeting_id, join = "phone", number, f"tel:+{number}"
        elif "JITSI" in kind.upper():
            room = link or access
            if "meet.jit.si" not in room and not re.search(r"[A-Za-z]", access):
                continue
            platform, meeting_id = "jitsi", access or room
            join = room if room.startswith("http") else ""
        elif "TELEGRAM" in kind.upper():
            platform, meeting_id = "telegram", link or access
            join = link if link.startswith("http") else ""
        elif "MEET" in kind.upper():
            platform, meeting_id = "meet", link or access
            join = link if link.startswith("http") else ""
        elif "WEBEX" in kind.upper():
            platform, meeting_id = "other", link or access
            join = link if link.startswith("http") else ""
        elif "PERSON" in kind.upper():
            if re.search(r"request address|use link|see link", access or "", re.I):
                continue
            platform, meeting_id = "inperson", access or name
        else:
            continue
        if not join and platform in {"telegram", "jitsi", "meet", "other"}:
            continue
        raw_lang = clean(language)
        language_name = LANGS.get(raw_lang.lower(), "")
        if not language_name:
            if re.search(r"[А-Яа-яЁё]", name):
                language_name = "Russian"
            elif re.fullmatch(r"[A-Za-z][A-Za-z \-]{1,24}", raw_lang or ""):
                language_name = raw_lang.title()
            else:
                language_name = "English"
        extra_access = access if access and access not in {meeting_id, code} and "@" not in access[:3] else ""
        if platform == "phone" and extra_access and phone_digits(extra_access, country) == meeting_id and len(extra_access) < 24:
            extra_access = ""
        notes = "\n".join(part for part in [
            theme, cadence, f"{kind}. {country}".strip(". "),
            raw_lang if raw_lang and language_name.lower() not in raw_lang.lower() else "",
            extra_access if extra_access and extra_access.lower() not in (name or "").lower() else "",
        ] if part)
        for weekday in days:
            item = row(
                id=f"arts-{slug(name)}-{weekday}-{start[0]}{start[1]:02d}-{slug(meeting_id)[:12]}",
                name=name, weekday=weekday, hour=start[0], minute=start[1], zone=zone,
                duration=duration_of(when, start), platform=platform, meeting_id=meeting_id,
                password=password, join=join, notes=notes, gender=gender_for(blob),
                program="arts", language=language_name or "English",
                location=country if platform != "inperson" else access,
            )
            if item:
                meetings.append(item)
    return meetings


def from_ceahow() -> list:
    html = fetch("https://lahow.org/meetings.html")
    cards = re.findall(r'<div class="mtg-card[\s\S]*?(?=<div class="mtg-card|<h2|$)', html)
    meetings = []
    for card in cards:
        ident = re.search(r'data-id="(\d+)"', card)
        fmt = re.search(r'data-format="([^"]+)"', card)
        name = re.search(r'class="mtg-row-name-text"[^>]*>(.*?)</span>', card, re.S)
        when = re.search(r'class="mtg-row-time".*?>(.*?)</span>', card, re.S)
        group = re.search(r'class="mtg-row-group"[^>]*>(.*?)</span>', card, re.S)
        region = re.search(r'class="mtg-row-region"[^>]*>(.*?)</span>', card, re.S)
        address = re.search(r'data-address="([^"]*)"', card)
        if not (ident and name and when):
            continue
        plain_time = text_of(when.group(1))
        plain = text_of(card)
        start = clock(plain_time)
        day = re.search(r"(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)", plain_time, re.I)
        zone_match = re.search(r'class="tz-label"[^>]*>(.*?)</span>', card, re.S)
        zone = zone_for(zone_match.group(1) if zone_match else "Eastern")
        if not start or not day or not zone:
            continue
        weekday = WEEK.index(day.group(1).capitalize())
        lang = "Spanish" if "mc-badge-lang-es" in card else "English"
        zoom_id = re.search(r"Meeting ID\s+((?:\d[\d ]{8,16}\d))", plain, re.I)
        phone = re.search(r"Phone\s+([0-9][0-9\- ().]{8,})", plain, re.I)
        code = re.search(r"(?:Access Code|Passcode)\s+([A-Za-z0-9#]{2,16})", plain, re.I)
        jitsi = re.search(r"https?://meet\.jit\.si/[A-Za-z0-9_-]+", card)
        zoom_href = re.search(r'https?://(?:[\w.-]+\.)?zoom\.us/j/\d+[^"\s<]*', card)
        digits = re.sub(r"\D", "", zoom_id.group(1)) if zoom_id else ""
        number = phone_digits(phone.group(1)) if phone else ""
        password = human_pw(code.group(1)) if code else ""
        place = unescape(address.group(1)) if address else ""
        where = clean(text_of(region.group(1))) if region else ""
        if where.lower() == "non-geographic":
            where = ""
        location = place or where
        platform = meeting_id = join = ""
        if 9 <= len(digits) <= 12:
            platform, meeting_id = "zoom", digits
            join = zoom_href.group(0) if zoom_href else f"https://zoom.us/j/{digits}"
            join = join.split("?")[0] if password else join
        elif jitsi:
            platform, meeting_id, join = "jitsi", jitsi.group(0).rstrip("/").split("/")[-1], jitsi.group(0)
        elif number:
            platform, meeting_id, join = "phone", number, f"tel:+{number}"
        elif fmt and fmt.group(1) in {"in-person", "hybrid"} and place:
            platform, meeting_id = "inperson", place
        else:
            continue
        notes = clean(text_of(group.group(1))) if group else ""
        extra = re.search(r"\bNotes\s+(.{0,400})", plain)
        if extra:
            notes = (notes + "\n" + extra.group(1)).strip()
        item = row(
            id=f"ceahow-{ident.group(1)}",
            name=text_of(name.group(1)), weekday=weekday, hour=start[0], minute=start[1],
            zone=zone, duration=60, platform=platform, meeting_id=meeting_id, password=password,
            join=join, notes=notes, gender=gender_for(plain), program="ceahow", language=lang,
            location=location,
        )
        if item:
            meetings.append(item)
    return meetings


def from_sia() -> list:
    html = fetch("https://siawso.org/meetings/?tsml-day=any")
    rough = []
    for tr in re.findall(r"<tr class=\"notes[\s\S]*?</tr>", html):
        href = re.search(r'href="(https://siawso.org/meetings/[^"]+)"', tr)
        name = re.search(r'href="https://siawso.org/meetings/[^"]+">\s*([^<]+)', tr)
        when = re.search(r"<span>\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)</span>\s*<span>\s*([^<]+)", tr)
        zone = re.search(r'class="region[\s\S]*?>\s*([^<]+)', tr)
        address = re.search(r'class="address[\s\S]*?>([\s\S]*?)</td>', tr)
        types = re.search(r'class="types[\s\S]*?>([\s\S]*?)</td>', tr)
        if not (href and name and when and zone):
            continue
        start = clock(when.group(2))
        zone_name = clean(zone.group(1))
        if not start or "/" not in zone_name:
            continue
        rough.append({
            "url": href.group(1).split("?")[0],
            "name": clean(name.group(1)),
            "weekday": WEEK.index(when.group(1)),
            "hour": start[0],
            "minute": start[1],
            "zone": zone_name,
            "address": clean(text_of(address.group(1))) if address else "",
            "types": clean(text_of(types.group(1))) if types else "",
            "online": "attendance-online" in tr or "attendance-hybrid" in tr,
            "person": "attendance-in_person" in tr or "attendance-hybrid" in tr,
        })

    def detail(item):
        try:
            page = fetch(item["url"])
        except Exception:
            page = ""
        notes = ""
        match = re.search(r'class="meeting-notes"[\s\S]*?</section>', page)
        if match:
            notes = clean(text_of(match.group(0)))
            notes = re.sub(r"^notes\s*", "", notes, flags=re.I)
        links = re.findall(r'href="(https?://[^"]+)"', page)
        return item, notes, links

    meetings = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(detail, item) for item in rough]
        for future in as_completed(futures):
            item, notes, links = future.result()
            zoom = []
            jitsi = []
            for link in links:
                if "zoom.us/j/" in link:
                    zoom.append(unescape(link))
                elif "meet.jit.si/" in link:
                    jitsi.append(link)
            zoom = list(dict.fromkeys(zoom))
            platform = meeting_id = join = ""
            password = ""
            pw = re.search(r"(?:passcode|password)\s*(?:is|:)?\s*([A-Za-z0-9]{2,16})", notes, re.I)
            if pw:
                password = human_pw(pw.group(1))
            if len(zoom) == 1:
                digits = re.search(r"/j/(\d+)", zoom[0]).group(1)
                platform, meeting_id, join = "zoom", digits, zoom[0].split("?")[0] if password else zoom[0]
            elif jitsi:
                platform, meeting_id, join = "jitsi", jitsi[0].rstrip("/").split("/")[-1], jitsi[0]
            elif item["person"] and item["address"]:
                platform, meeting_id = "inperson", item["address"]
            else:
                continue
            language = "English"
            for label, name in LANGS.items():
                if label in item["types"].lower() or label in item["name"].lower():
                    language = name
                    break
            slug_id = item["url"].rstrip("/").split("/")[-1]
            made = row(
                id=f"sia-{slug_id}"[:80],
                name=item["name"], weekday=item["weekday"], hour=item["hour"], minute=item["minute"],
                zone=item["zone"], duration=60, platform=platform, meeting_id=meeting_id,
                password=password, join=join,
                notes="\n".join(part for part in [item["types"], notes] if part),
                gender=gender_for(item["types"] + " " + item["name"]),
                program="sia", language=language,
                location="" if platform != "inperson" else item["address"],
            )
            if made:
                meetings.append(made)
    return meetings


def from_dda() -> list:
    html = fetch("https://ddainc.org/online-dda-meetings/")
    text = text_of(html)
    squashed = re.sub(r"\D", "", text)
    if "84935395086" not in squashed:
        return []
    cancelled_friday_morning = "no meeting friday at 10" in text.lower()
    # Lines checked against the Oregon page. Friday 10:00 is still printed, but the
    # same page says that meeting has no host. The monthly open mic is not weekly.
    oregon = [
        (7, 10, 0, "SUNDAY-10AM", "Dual Diagnosis Anonymous"),
        (7, 17, 0, "SUNDAY- 5 to 6PM", "Dual Diagnosis Anonymous"),
        (1, 10, 0, "MONDAY-10 to 11", "Dual Diagnosis Anonymous"),
        (1, 17, 0, "MONDAY- 5to 6 PM", "Dual Diagnosis Anonymous"),
        (2, 10, 0, "TUESDAY-10 to 11", "Dual Diagnosis Anonymous"),
        (2, 17, 0, "TUESDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"),
        (3, 10, 0, "WEDNESDAY- 10 to 11", "Dual Diagnosis Anonymous"),
        (3, 17, 0, "Wednesdays- 5pm to 6PM", "Dual Diagnosis Anonymous"),
        (4, 10, 0, "Book Study Meeting THURSDAY- 10 to 11", "DDA book study"),
        (4, 12, 0, "THURSDAY- 12pm to 1pm", "DDA women's meeting"),
        (4, 17, 0, "THURSDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"),
        (5, 10, 0, "FRIDAY- 10 to 11", "Dual Diagnosis Anonymous"),
        (5, 17, 0, "FRIDAY-5 to 6 pm", "Dual Diagnosis Anonymous"),
        (6, 10, 0, "SATURDAY-10 to 11am", "Dual Diagnosis Anonymous"),
        (6, 17, 0, "SATURDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"),
    ]
    meetings = []
    note = "Online meeting on the Dual Diagnosis Anonymous of Oregon list. The page says no passcode is needed. Times are the Pacific clock printed there. A once-a-month open mic is not listed."
    for weekday, hour, minute, marker, name in oregon:
        if marker not in text and marker.replace("’", "'") not in text:
            continue
        if weekday == 5 and hour == 10 and cancelled_friday_morning:
            continue
        item = row(
            id=f"dda-or-{weekday}-{hour}{minute:02d}",
            name=name, weekday=weekday, hour=hour, minute=minute,
            zone="America/Los_Angeles", duration=60, platform="zoom",
            meeting_id="84935395086", password="",
            join="https://us02web.zoom.us/j/84935395086",
            notes=note, gender=gender_for(name), program="dda", language="English",
            location="Online",
        )
        if item:
            meetings.append(item)
    if "Couple Screws Loose" in text and "383 232 8581" in text:
        meetings.append(row(
            id="dda-marysville-thu",
            name="Couple Screws Loose",
            weekday=4, hour=12, minute=0, zone="America/Los_Angeles", duration=90,
            platform="zoom", meeting_id="3832328581", password="",
            join="https://zoom.us/j/3832328581",
            notes="Hybrid meeting in Marysville, Washington. The Oregon page prints Thursday 12:00–1:30 pm and does not name a zone; stored as Pacific. No street address and no passcode were printed.",
            gender="ALL", program="dda", language="English", location="Marysville, WA",
        ))
    if "Women Only meeting Tuesdays at 8 pm" in text and "383 232 8581" in text:
        meetings.append(row(
            id="dda-marysville-tue-women",
            name="DDA women's meeting",
            weekday=2, hour=20, minute=0, zone="America/Los_Angeles", duration=60,
            platform="zoom", meeting_id="3832328581", password="DDA",
            join="https://zoom.us/j/3832328581",
            notes="Marysville, Washington. The Oregon page prints Tuesday 8 pm with passcode DDA and does not name a zone; stored as Pacific.",
            gender="WOMEN_ONLY", program="dda", language="English", location="Marysville, WA",
        ))
    if "Sun-Sat at 5pm" in text and "84624074949" in squashed and "Temporarily on hold" not in text[text.find("North Carolina"):text.find("North Carolina")+400]:
        for weekday in range(1, 8):
            meetings.append(row(
                id=f"dda-nc-{weekday}",
                name="DDA North Carolina",
                weekday=weekday, hour=17, minute=0, zone="America/Los_Angeles", duration=60,
                platform="zoom", meeting_id="84624074949", password="",
                join="https://us06web.zoom.us/j/84624074949?pwd=cENleUdrMzNvQ00zNThBSFFZZXlCdz09",
                notes="The Oregon page says Sunday through Saturday at 5 pm Pacific. The Zoom link keeps the token from that page. Questions: budman@ddanc.org.",
                contact="budman@ddanc.org", gender="ALL", program="dda", language="English",
                location="North Carolina",
            ))
    if "Tuesdays at 3pm" in text and "86391701942" in squashed:
        meetings.append(row(
            id="dda-nj-tue",
            name="DDA New Jersey",
            weekday=2, hour=15, minute=0, zone="America/Los_Angeles", duration=60,
            platform="zoom", meeting_id="86391701942", password="",
            join="https://us06web.zoom.us/j/86391701942?pwd=4P1lkHaLiuKTnmWibLLK2aXtHUlh7g.1",
            notes="The Oregon page says Tuesday at 3 pm Pacific. The Zoom link keeps the token from that page.",
            gender="ALL", program="dda", language="English", location="New Jersey",
        ))
    meetings.extend(from_dda_uk())
    return [item for item in meetings if item]


def from_dda_uk() -> list:
    try:
        html = fetch("https://www.ddauk.org/meetings/")
    except Exception as error:
        print("dda uk FAILED", error)
        return []
    chunks = re.split(r"<h3[^>]*>", html)[1:]
    meetings = []
    skip_zoom = {"84935395086", "84624074949", "89948153184", "3832328581"}
    for chunk in chunks:
        end = chunk.lower().find("<h3")
        card = chunk if end < 0 else chunk[:end]
        plain = clean(text_of(card))
        title = plain.split(" at:")[0].strip()
        if "meeting" not in title.lower() and "hope" not in title.lower():
            continue
        gmt = re.search(r"(\d{1,2}):(\d{2})\s*Hours\s*\(GMT\)", plain, re.I)
        day = re.search(r"Day of Meeting:\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)", plain, re.I)
        if not gmt or not day:
            continue
        hour, minute = int(gmt.group(1)), int(gmt.group(2))
        titled = clock(title)
        if titled and (titled[0] != hour or titled[1] != minute):
            continue
        if re.search(r"on hold|temporarily", plain, re.I):
            continue
        zoom = re.search(r'zoom\.us/j/(\d+)(\?pwd=[^"&\s]+)?', card)
        place = re.search(r'maps/search/([^"&]+)', card)
        address = clean(unescape(re.sub(r"%20", " ", place.group(1)))) if place else ""
        address = address.replace("%2C", ",")
        if zoom and zoom.group(1) in skip_zoom:
            continue
        platform = meeting_id = join = ""
        if zoom:
            platform, meeting_id = "zoom", zoom.group(1)
            join = "https://zoom.us/j/" + meeting_id + (zoom.group(2) or "")
        elif address:
            platform, meeting_id = "inperson", address
        else:
            continue
        name = title
        name = re.sub(r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?\s+)?", "", name, flags=re.I)
        name = clean(name) or title
        item = row(
            id=f"dda-uk-{slug(name)[:32]}-{WEEK.index(day.group(1).capitalize())}-{hour}{minute:02d}-{(re.sub(r'[^a-z0-9]', '', meeting_id.lower())[-4:] or 'mtg')}",
            name=name, weekday=WEEK.index(day.group(1).capitalize()),
            hour=hour, minute=minute, zone="UTC", duration=60,
            platform=platform, meeting_id=meeting_id, join=join,
            notes="Listed by DDA UK at " + gmt.group(0) + ". The clock is the GMT hour on that page, not a converted local time.",
            gender=gender_for(title), program="dda", language="English",
            location=address or "Online",
        )
        if item:
            meetings.append(item)
    return meetings


def faa_lines(html: str) -> list:
    text = text_of(html)
    return [line.strip() for line in text.splitlines() if line.strip()]


def from_faa() -> list:
    meetings = []
    virtual = fetch("https://faacanhelp.org/meetings/virtual-meetings/")
    lines = faa_lines(virtual)
    days = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7}
    i = 0
    while i < len(lines) - 4:
        weekday = days.get(lines[i])
        start = clock(lines[i + 1]) if weekday else None
        digits = re.sub(r"\D", "", lines[i + 2]) if weekday else ""
        if not weekday or not start or not (9 <= len(digits) <= 12):
            i += 1
            continue
        password = human_pw(lines[i + 3])
        name = lines[i + 4]
        if name in days or len(name) < 3:
            i += 1
            continue
        notes = []
        j = i + 5
        while j < len(lines) and lines[j] not in days:
            if "protected email" not in lines[j].lower() and lines[j] not in {"CONTACT INFO:"}:
                notes.append(lines[j])
            j += 1
        zone = zone_for(lines[i + 1]) or "America/New_York"
        item = row(
            id=f"faa-zoom-{slug(name)}-{weekday}-{start[0]}{start[1]:02d}",
            name=name, weekday=weekday, hour=start[0], minute=start[1], zone=zone,
            duration=duration_of(lines[i + 1], start), platform="zoom", meeting_id=digits,
            password=password, join=f"https://zoom.us/j/{digits}",
            notes="\n".join(notes[:4] + ["Food Addicts Anonymous virtual intergroup. Passcode is the one printed next to the meeting id."]),
            gender=gender_for(name + " " + " ".join(notes[:3])),
            program="faa", language="English", location="Online",
        )
        if item:
            meetings.append(item)
        i = j
    phone = fetch("https://faacanhelp.org/meetings/phone-meetings/")
    lines = faa_lines(phone)
    i = 0
    while i < len(lines) - 4:
        weekday = days.get(lines[i])
        start = clock(lines[i + 1]) if weekday else None
        number = phone_digits(lines[i + 3]) if weekday and start else ""
        if not weekday or not start or not number:
            i += 1
            continue
        topic = lines[i + 2]
        pin = human_pw(lines[i + 4])
        group = lines[i + 5] if i + 5 < len(lines) and lines[i + 5] not in days else ""
        if topic in days:
            i += 1
            continue
        item = row(
            id=f"faa-phone-{slug(topic)}-{weekday}-{start[0]}{start[1]:02d}",
            name=topic, weekday=weekday, hour=start[0], minute=start[1],
            zone="America/New_York", duration=duration_of(lines[i + 1], start),
            platform="phone", meeting_id=number, password=pin, join=f"tel:+{number}",
            notes="\n".join(part for part in [
                "Food Addicts Anonymous phone meeting. The page heads this column Time (ET).",
                f"Group {group}." if group else "",
                "Dial in, then enter the access code.",
            ] if part),
            gender=gender_for(topic), program="faa", language="English", location="Phone",
        )
        if item:
            meetings.append(item)
        i = i + 6 if group else i + 5
    return meetings


def from_aba() -> list:
    html = fetch("https://www.aba12steps.org/meeting-info")
    decoder = json.JSONDecoder()
    found = []
    seen = set()
    idx = 0
    while True:
        at = html.find('"meetingTimeStart":"', idx)
        if at < 0:
            break
        start = html.rfind("{", 0, at)
        try:
            obj, end = decoder.raw_decode(html, start)
        except Exception:
            idx = at + 20
            continue
        idx = max(end, at + 20)
        if not isinstance(obj, dict) or not obj.get("title") or not obj.get("meetingTimeZone"):
            continue
        ident = obj.get("_id") or obj.get("title")
        if ident in seen:
            continue
        seen.add(ident)
        found.append(obj)
    day_names = {name: number for number, name in enumerate(WEEK) if name}
    meetings = []
    for obj in found:
        title = clean(obj.get("title") or "")
        if not title or re.search(r"ab-?anon|teen", title, re.I):
            continue
        status = (obj.get("_publishStatus") or "PUBLISHED").upper()
        if status not in {"PUBLISHED", ""}:
            continue
        days = obj.get("meetingDays") or []
        if isinstance(days, str):
            days = [days]
        stamp = str(obj.get("meetingTimeStart") or "")
        end = str(obj.get("meetingTimeEnd") or "")
        matched = re.match(r"(\d{1,2}):(\d{2})", stamp)
        if not matched:
            continue
        hour, minute = int(matched.group(1)), int(matched.group(2))
        end_match = re.match(r"(\d{1,2}):(\d{2})", end)
        duration = 60
        if end_match:
            span = (int(end_match.group(1)) * 60 + int(end_match.group(2))) - (hour * 60 + minute)
            if span <= 0:
                span += 24 * 60
            if 15 <= span <= 180:
                duration = span
        zone = str(obj.get("meetingTimeZone") or "").replace("\\/", "/")
        label = str(obj.get("idOrAdTitle") or "")
        raw_id = clean(str(obj.get("meetingIdOrAddress") or ""))
        link = unescape(str(obj.get("zoomOrMapLink") or "")).replace("\\/", "/")
        code_label = str(obj.get("passOrCityTitle") or "")
        secret = clean(str(obj.get("passwordOrCityOfOrigin") or ""))
        if secret.lower() in {"not provided", "none", "n/a"}:
            secret = ""
        password = human_pw(secret) if "code" in code_label.lower() else ""
        if secret and not password and "code" in code_label.lower():
            secret_note = "The meeting page does not print a passcode. It says: " + secret
        else:
            secret_note = ""
        city = secret if "city" in code_label.lower() else ""
        types = obj.get("meetingType") or []
        if isinstance(types, str):
            types = [types]
        where = clean(str(obj.get("meetingLocation") or ""))
        region = clean(str(obj.get("meetingRegion") or ""))
        zoom = re.search(r"zoom\.us/j/(\d+)", link)
        digits = re.sub(r"\D", "", raw_id)
        address = raw_id if "address" in label.lower() else ""
        platform = meeting_id = join = ""
        if zoom or (9 <= len(digits) <= 12 and "zoom" in label.lower()):
            meeting_id = zoom.group(1) if zoom else digits
            platform = "zoom"
            join = link if link.startswith("http") else f"https://zoom.us/j/{meeting_id}"
            if password:
                join = join.split("?")[0]
        elif address and ("person" in where.lower() or "hybrid" in where.lower() or not link):
            platform, meeting_id = "inperson", address
        else:
            continue
        email = clean(str(obj.get("contactEmailAddress1") or ""))
        person = clean(str(obj.get("contactPerson") or ""))
        phone = clean(str(obj.get("contactPhone") or ""))
        bits = [bit for bit in (person, email, phone) if bit and bit.lower() != "not provided"]
        extra = clean(re.sub(r"<[^>]+>", " ", str(obj.get("addedInformation") or "")))
        kind = ", ".join(types)
        hybrid = "hybrid" in where.lower() or any("hybrid" in item.lower() for item in types)
        notes = "\n".join(part for part in [
            kind,
            "Hybrid." if hybrid and platform == "zoom" else "",
            region,
            extra[:400],
            secret_note,
            "Time and zone are the ones stored on the ABA meeting page, not the clock converted to the visitor's computer.",
        ] if part)
        language = "English"
        blob = " ".join([title, kind, region, extra[:200]]).lower()
        for label_name, language_name in LANGS.items():
            if re.search(rf"\b{re.escape(label_name)}\b", blob):
                language = language_name
                break
        location = address or city or ("" if platform == "zoom" else region)
        if platform == "zoom" and not location:
            location = "Online"
        for day in days:
            weekday = day_names.get(str(day).capitalize())
            if not weekday:
                continue
            item = row(
                id=f"aba-{slug(title)}-{weekday}-{hour}{minute:02d}",
                name=title, weekday=weekday, hour=hour, minute=minute, zone=zone,
                duration=duration, platform=platform, meeting_id=meeting_id, password=password,
                join=join, notes=notes, contact=", ".join(bits)[:240],
                gender=gender_for(title + " " + blob), program="aba", language=language,
                location=location,
            )
            if item:
                meetings.append(item)
    return meetings


def from_ra() -> list:
    text = text_of(fetch("https://www.r-a.org/H_Meet.htm"))
    meetings = []
    if "0330 777 2413" in text and "735 058" in text and "women" in text.lower():
        for weekday in (7, 1, 2, 3, 4, 5):
            item = row(
                id=f"ra-women-phone-{weekday}",
                name="R.A. phone solution discussion",
                weekday=weekday, hour=9, minute=0, zone="Europe/London", duration=60,
                platform="phone", meeting_id="443307772413", password="735058",
                join="tel:+443307772413",
                notes="Women's meeting, Sunday through Friday, 9:00 am UK time. US dial-in (978) 990-5000, same access code. South Africa dial-in on the page uses a different code.",
                gender="WOMEN_ONLY", program="recoveries", language="English", location="Phone",
            )
            if item:
                meetings.append(item)
    if "86823856912" in re.sub(r"\D", "", text) or "868 2385 6912" in text:
        if "8:00 pm in Israel" in text or "8:00 pm" in text:
            meetings.append(row(
                id="ra-thu-zoom",
                name="R.A. solution discussion",
                weekday=4, hour=20, minute=0, zone="Asia/Jerusalem", duration=60,
                platform="zoom", meeting_id="86823856912", password="1234",
                join="https://us02web.zoom.us/j/86823856912",
                notes="Thursday. The page keeps this at 8:00 pm Israel time. English.",
                program="recoveries", language="English", location="Online",
            ))
        if "6:15 pm" in text:
            meetings.append(row(
                id="ra-mon-zoom",
                name="R.A. solution discussion",
                weekday=1, hour=18, minute=15, zone="Asia/Jerusalem", duration=60,
                platform="zoom", meeting_id="86823856912", password="1234",
                join="https://us02web.zoom.us/j/86823856912",
                notes="Monday. The page keeps this at 6:15 pm Jerusalem time. English.",
                program="recoveries", language="English", location="Online",
            ))
    return [item for item in meetings if item]


def from_eha() -> list:
    text = text_of(fetch("https://www.emotionalhealthanonymous.org/meetings"))
    if "sgveha@hotmail.com" not in text:
        return []
    email = "sgveha@hotmail.com"
    note = "Virtual login is not on the page. The San Gabriel Valley intergroup says to email and they will send it."
    specs = [
        ("eha-sun", "Big Book study", 7, 16, 0, "email", email, f"mailto:{email}", "ALL", note),
        ("eha-mon", "45 Live", 1, 20, 15, "inperson", "45 E. Laurel Ave, Sierra Madre, CA", "", "ALL",
         "Episcopal Church of the Ascension, large blue house behind the church. Virtual login is by email to " + email + "."),
        ("eha-wed", "At the Gates", 3, 20, 15, "email", email, f"mailto:{email}", "ALL", note),
        ("eha-thu", "Men's meeting", 4, 20, 15, "email", email, f"mailto:{email}", "MEN_ONLY", note),
        ("eha-fri", "Page 102", 5, 20, 15, "email", email, f"mailto:{email}", "ALL", note),
    ]
    meetings = []
    for ident, name, weekday, hour, minute, platform, meeting_id, join, who, notes in specs:
        if name.split()[0].lower() not in text.lower() and name.lower() not in text.lower():
            continue
        meetings.append(row(
            id=ident, name=name, weekday=weekday, hour=hour, minute=minute,
            zone="America/Los_Angeles", duration=60, platform=platform, meeting_id=meeting_id,
            join=join, notes=notes, contact=email, gender=who, program="eha",
            language="English", location="San Gabriel Valley" if platform == "email" else meeting_id,
        ))
    return [item for item in meetings if item]


def from_coanon() -> list:
    pages = [
        "arizona", "germany", "sweden", "california", "netherlands", "texas",
        "canada", "south-africa", "united-kingdom",
    ]
    day_word = r"(?:Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)"
    meetings = []
    for page in pages:
        try:
            html = fetch(f"https://www.co-anon.org/meetings/{page}")
        except Exception as error:
            print("coanon skip", page, error)
            continue
        parts = re.split(rf"(?i)(?={day_word}\b)", html)
        for part in parts:
            day = re.match(rf"(?i)({day_word})", part)
            if not day:
                continue
            weekday_name = re.sub(r"s$", "", day.group(1).capitalize(), flags=re.I)
            if weekday_name not in WEEK:
                continue
            weekday = WEEK.index(weekday_name)
            plain = text_of(part)
            when = re.search(r"When:\s*([^\n]+)", plain, re.I)
            if not when:
                continue
            start = clock(when.group(1))
            if not start:
                continue
            zone_match = re.search(r"Time zone:\s*([^\n]+)", plain, re.I)
            zone = zone_for(zone_match.group(1) if zone_match else "")
            zone_note = ""
            if not zone and re.search(r"\bontario\b|\bsudbury\b", plain, re.I):
                zone = "America/Toronto"
                zone_note = "The page does not name a time zone. Stored as Eastern because the address is in Ontario."
            if not zone:
                continue
            where = re.search(r"Where:\s*([^\n]+)", plain, re.I)
            language = re.search(r"Language:\s*([^\n]+)", plain, re.I)
            zoom = re.search(r'href="(https?://(?:[\w.-]+\.)?zoom\.us/j/[^"]+)"', part)
            named = re.search(rf"(?i){day_word}\s+(.+?)\s+When:", plain)
            name = clean(named.group(1)) if named else ""
            if not name or name.lower() in {"when:", page, "co-anon"}:
                lines = [line.strip() for line in plain.splitlines() if line.strip()]
                for index, line in enumerate(lines):
                    if line.lower().startswith("when"):
                        for prev in reversed(lines[:index]):
                            if re.match(day_word, prev, re.I):
                                break
                            if re.search(r"first meeting|copyright|below you", prev, re.I):
                                continue
                            name = clean(prev)
                            break
                        break
            if not name:
                name = "Co-Anon"
            password = ""
            platform = meeting_id = join = ""
            location = clean(where.group(1)) if where else ""
            if zoom:
                url = unescape(zoom.group(1)).split("?")[0]
                digits = re.search(r"/j/(\d+)", url)
                if not digits:
                    continue
                platform, meeting_id, join = "zoom", digits.group(1), url
            else:
                listed = re.search(r"Meeting ID:\s*((?:\d[\d ]{7,14}\d))", plain, re.I)
                if listed and re.search(r"\bzoom\b", plain, re.I):
                    digits = re.sub(r"\D", "", listed.group(1))
                    if 9 <= len(digits) <= 12:
                        platform, meeting_id, join = "zoom", digits, f"https://zoom.us/j/{digits}"
            if not platform and location and not re.search(r"visit the co-anon", plain, re.I):
                platform, meeting_id = "inperson", location
            if not platform:
                continue
            pw = re.search(r"Password:\s*([A-Za-z0-9 ]{2,24})", plain, re.I)
            if pw:
                password = human_pw(pw.group(1))
            topic = re.search(r"Meeting type/topic:\s*([^\n]+)", plain, re.I)
            contact_line = re.search(r"Contact:\s*([^\n]+)", plain, re.I)
            notes = " ".join(part for part in [
                f"Co-Anon, {page.replace('-', ' ')}.",
                topic.group(1).strip() if topic else "",
                zone_note,
                "First meeting date is on the page." if re.search(r"first meeting", plain, re.I) else "",
            ] if part)
            item = row(
                id=f"coanon-{page}-{slug(name)}-{weekday}-{start[0]}{start[1]:02d}",
                name=name, weekday=weekday, hour=start[0], minute=start[1], zone=zone,
                duration=duration_of(when.group(1), start), platform=platform, meeting_id=meeting_id,
                password=password, join=join, notes=notes,
                contact=clean(contact_line.group(1)) if contact_line else "",
                gender=gender_for(name), program="coanon",
                language=LANGS.get((language.group(1).strip().lower() if language else "english"), "English"),
                location=location or ("Online" if platform == "zoom" else page.replace("-", " ")),
            )
            if item:
                meetings.append(item)
    return meetings


def main() -> None:
    batches = [
        ("arts", from_arts),
        ("ceahow", from_ceahow),
        ("sia", from_sia),
        ("dda", from_dda),
        ("faa", from_faa),
        ("aba", from_aba),
        ("recoveries", from_ra),
        ("eha", from_eha),
        ("coanon", from_coanon),
    ]
    found = []
    for name, func in batches:
        try:
            rows = func()
        except Exception as error:
            print(f"{name}: FAILED {type(error).__name__} {error}")
            continue
        print(f"{name}: {len(rows)}")
        found.extend(rows)
    seen = set()
    unique = []
    for meeting in found:
        key = (meeting["programId"], meeting["weekday"], meeting["hour"], meeting["minute"], meeting["meetingId"], meeting["name"].lower())
        if key in seen:
            continue
        seen.add(key)
        unique.append(meeting)
    ids = [item["id"] for item in unique]
    dupes = len(ids) - len(set(ids))
    print("unique", len(unique), "id-dupes", dupes)
    used = set()
    for meeting in unique:
        base = meeting["id"]
        n = 2
        while meeting["id"] in used:
            meeting["id"] = f"{base}-{n}"
            n += 1
        used.add(meeting["id"])
    if dupes:
        from collections import Counter
        counts = Counter(ids)
        print("dup ids", [item for item, count in counts.items() if count > 1][:10])
    out = ROOT / "src/data/more-12step.json"
    out.write_text(json.dumps(unique, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", out)
    catalog_path = ROOT / "public/catalog/meetings.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    have = {item["id"] for item in catalog}
    added = 0
    for meeting in unique:
        if meeting["id"] in have:
            continue
        catalog.append(meeting)
        have.add(meeting["id"])
        added += 1
    payload = json.dumps(catalog, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    catalog_path.write_bytes(payload)
    version = hashlib.sha256(payload).hexdigest()[:12]
    (ROOT / "src/lib/meetings/catalog-version.ts").write_text(
        f'export const CATALOG_VERSION = "{version}";\n', encoding="utf-8"
    )
    print("added", added, "catalog", len(catalog), "version", version)


if __name__ == "__main__":
    main()
