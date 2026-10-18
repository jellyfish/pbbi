import json
import re
import sqlite3
from pathlib import Path

RAW_DIR = Path("data/raw")
DB_PATH = Path("data/nhl_coaches.db")

# Dictionary of phallic rules and tiers
# Tier 1 ("core"): Explicitly mentioned by user ("cock", "tip", "wood", "knob", "dick", plus "Richard" as a first name -> "Dick")
# Tier 2 ("anatomical"): Unambiguous common anatomical slang for penis ("peter", "rod", "willie", "johnson")
# Tier 3 ("extended"): Broader/double-entendre substrings ("richard" in surname, "johnston", "bush", "long", "sacco", "creamer", "pierre")
PHALLIC_RULES = [
    {
        "rule_id": "cock",
        "label": '"cock"',
        "pattern_type": "substring",
        "pattern": "cock",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains substring 'cock' (e.g., Ken Hitchcock, Mike Babcock)"
    },
    {
        "rule_id": "tip",
        "label": '"tip"',
        "pattern_type": "substring",
        "pattern": "tip",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains substring 'tip' (e.g., Dave Tippett)"
    },
    {
        "rule_id": "wood",
        "label": '"wood"',
        "pattern_type": "substring",
        "pattern": "wood",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains substring 'wood' (e.g., Jay Woodcroft)"
    },
    {
        "rule_id": "knob",
        "label": '"knob"',
        "pattern_type": "substring",
        "pattern": "knob",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains substring 'knob' (e.g., Kris Knoblauch)"
    },
    {
        "rule_id": "dick",
        "label": '"dick"',
        "pattern_type": "substring",
        "pattern": "dick",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains substring 'dick' (e.g., Dick Duff)"
    },
    {
        "rule_id": "rod",
        "label": '"rod"',
        "pattern_type": "substring",
        "pattern": "rod",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains 'rod', classic slang (e.g., Rod Brind'Amour)"
    },
    {
        "rule_id": "willie",
        "label": '"willie"',
        "pattern_type": "substring",
        "pattern": "willie",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains 'willie', classic slang (e.g., Willie Desjardins)"
    },
    {
        "rule_id": "johnson",
        "label": '"johnson"',
        "pattern_type": "substring",
        "pattern": "johnson",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains 'johnson', classic slang (e.g., Bob Johnson, Tom Johnson)"
    },
    {
        "rule_id": "peter",
        "label": '"peter"',
        "pattern_type": "substring",
        "pattern": "peter",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Contains 'peter', classic slang (e.g., Peter DeBoer, Peter Laviolette, Peter Horachek, Bill Peters)"
    },
    {
        "rule_id": "creamer",
        "label": '"creamer"',
        "pattern_type": "substring",
        "pattern": "creamer",
        "tier": "strict",
        "default_enabled": 1,
        "description": "Suggestive surname 'Creamer' (e.g., Pierre Creamer)"
    },
    {
        "rule_id": "richard",
        "label": '"richard"',
        "pattern_type": "richard",
        "pattern": "richard",
        "tier": "broad",
        "default_enabled": 0,
        "description": "Name is 'Richard' or 'Richards', traditional source of 'Dick' (e.g., Todd Richards)"
    },
    {
        "rule_id": "johnston",
        "label": '"johnston"',
        "pattern_type": "substring",
        "pattern": "johnston",
        "tier": "broad",
        "default_enabled": 0,
        "description": "Variant spelling of Johnson (e.g., Eddie Johnston, Marshall Johnston, Mike Johnston)"
    },
    {
        "rule_id": "bush",
        "label": '"bush"',
        "pattern_type": "substring",
        "pattern": "bush",
        "tier": "broad",
        "default_enabled": 0,
        "description": "Anatomical slang 'bush' (e.g., Eddie Bush)"
    },
    {
        "rule_id": "long",
        "label": '"long"',
        "pattern_type": "substring",
        "pattern": "long",
        "tier": "broad",
        "default_enabled": 0,
        "description": "Suggestive descriptor 'long' (e.g., Barry Long)"
    },
    {
        "rule_id": "sacco",
        "label": '"sacco" (sack)',
        "pattern_type": "substring",
        "pattern": "sacco",
        "tier": "broad",
        "default_enabled": 0,
        "description": "Phonetic match for 'sack' (e.g., Joe Sacco)"
    }
]

RICHARD_FIRST_NAME_COACH_IDS = {
    "duffdi01c",   # Terrance Richard "Dick" Duff
}

FRANCHISE_META = {
    "ANA": {"name": "Anaheim Ducks", "city": "Anaheim", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#F47A38", "color2": "#B9975B", "current_names": {"Anaheim Ducks", "Mighty Ducks of Anaheim"}, "relocated_from": None},
    "BOS": {"name": "Boston Bruins", "city": "Boston", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#FFB81C", "color2": "#000000", "current_names": {"Boston Bruins"}, "relocated_from": None},
    "BUF": {"name": "Buffalo Sabres", "city": "Buffalo", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#003087", "color2": "#FFB81C", "current_names": {"Buffalo Sabres"}, "relocated_from": None},
    "CAR": {"name": "Carolina Hurricanes", "city": "Raleigh", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#CC0000", "color2": "#000000", "current_names": {"Carolina Hurricanes"}, "relocated_from": "Hartford Whalers (1979–1997)"},
    "CBJ": {"name": "Columbus Blue Jackets", "city": "Columbus", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#002654", "color2": "#CE1126", "current_names": {"Columbus Blue Jackets"}, "relocated_from": None},
    "CGY": {"name": "Calgary Flames", "city": "Calgary", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#D2001C", "color2": "#FAAF19", "current_names": {"Calgary Flames"}, "relocated_from": "Atlanta Flames (1972–1980)"},
    "CHI": {"name": "Chicago Blackhawks", "city": "Chicago", "conf": "Western", "div": "Central", "active": 1, "color1": "#CF0A2C", "color2": "#000000", "current_names": {"Chicago Blackhawks", "Chicago Black Hawks"}, "relocated_from": None},
    "COL": {"name": "Colorado Avalanche", "city": "Denver", "conf": "Western", "div": "Central", "active": 1, "color1": "#6F263D", "color2": "#236192", "current_names": {"Colorado Avalanche"}, "relocated_from": "Quebec Nordiques (1979–1995)"},
    "DAL": {"name": "Dallas Stars", "city": "Dallas", "conf": "Western", "div": "Central", "active": 1, "color1": "#006847", "color2": "#8F8F8C", "current_names": {"Dallas Stars"}, "relocated_from": "Minnesota North Stars (1967–1993)"},
    "DET": {"name": "Detroit Red Wings", "city": "Detroit", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#CE1126", "color2": "#FFFFFF", "current_names": {"Detroit Red Wings"}, "relocated_from": None},
    "EDM": {"name": "Edmonton Oilers", "city": "Edmonton", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#FF4C00", "color2": "#041E42", "current_names": {"Edmonton Oilers"}, "relocated_from": None},
    "FLA": {"name": "Florida Panthers", "city": "Sunrise", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#C8102E", "color2": "#041E42", "current_names": {"Florida Panthers"}, "relocated_from": None},
    "LAK": {"name": "Los Angeles Kings", "city": "Los Angeles", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#111111", "color2": "#A2AAAD", "current_names": {"Los Angeles Kings"}, "relocated_from": None},
    "MIN": {"name": "Minnesota Wild", "city": "St. Paul", "conf": "Western", "div": "Central", "active": 1, "color1": "#154734", "color2": "#A6192E", "current_names": {"Minnesota Wild"}, "relocated_from": None},
    "MTL": {"name": "Montreal Canadiens", "city": "Montreal", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#AF1E2D", "color2": "#192168", "current_names": {"Montreal Canadiens"}, "relocated_from": None},
    "NJD": {"name": "New Jersey Devils", "city": "Newark", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#CE1126", "color2": "#000000", "current_names": {"New Jersey Devils"}, "relocated_from": "Kansas City Scouts (1974–76) & Colorado Rockies (1976–82)"},
    "NSH": {"name": "Nashville Predators", "city": "Nashville", "conf": "Western", "div": "Central", "active": 1, "color1": "#FFB81C", "color2": "#041E42", "current_names": {"Nashville Predators"}, "relocated_from": None},
    "NYI": {"name": "New York Islanders", "city": "Elmont", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#00539B", "color2": "#F47D30", "current_names": {"New York Islanders"}, "relocated_from": None},
    "NYR": {"name": "New York Rangers", "city": "New York", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#0038A8", "color2": "#CE1126", "current_names": {"New York Rangers"}, "relocated_from": None},
    "OTT": {"name": "Ottawa Senators", "city": "Ottawa", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#C52032", "color2": "#C2912C", "current_names": {"Ottawa Senators"}, "relocated_from": None},
    "PHI": {"name": "Philadelphia Flyers", "city": "Philadelphia", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#F74902", "color2": "#000000", "current_names": {"Philadelphia Flyers"}, "relocated_from": None},
    "PIT": {"name": "Pittsburgh Penguins", "city": "Pittsburgh", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#FCB514", "color2": "#000000", "current_names": {"Pittsburgh Penguins"}, "relocated_from": None},
    "SEA": {"name": "Seattle Kraken", "city": "Seattle", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#99D9D9", "color2": "#001628", "current_names": {"Seattle Kraken"}, "relocated_from": None},
    "SJS": {"name": "San Jose Sharks", "city": "San Jose", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#006D75", "color2": "#EA7200", "current_names": {"San Jose Sharks"}, "relocated_from": None},
    "STL": {"name": "St. Louis Blues", "city": "St. Louis", "conf": "Western", "div": "Central", "active": 1, "color1": "#002F87", "color2": "#FCB514", "current_names": {"St. Louis Blues"}, "relocated_from": None},
    "TBL": {"name": "Tampa Bay Lightning", "city": "Tampa", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#002868", "color2": "#FFFFFF", "current_names": {"Tampa Bay Lightning"}, "relocated_from": None},
    "TOR": {"name": "Toronto Maple Leafs", "city": "Toronto", "conf": "Eastern", "div": "Atlantic", "active": 1, "color1": "#00205B", "color2": "#FFFFFF", "current_names": {"Toronto Maple Leafs"}, "relocated_from": None},
    "UTA": {"name": "Utah Mammoth", "city": "Salt Lake City", "conf": "Western", "div": "Central", "active": 1, "color1": "#6CACE4", "color2": "#010101", "current_names": {"Utah Mammoth", "Utah Hockey Club"}, "relocated_from": "Winnipeg Jets (1979–96) & Phoenix/Arizona Coyotes (1996–2024)"},
    "VAN": {"name": "Vancouver Canucks", "city": "Vancouver", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#00205B", "color2": "#00843D", "current_names": {"Vancouver Canucks"}, "relocated_from": None},
    "VEG": {"name": "Vegas Golden Knights", "city": "Las Vegas", "conf": "Western", "div": "Pacific", "active": 1, "color1": "#B4975A", "color2": "#333F42", "current_names": {"Vegas Golden Knights"}, "relocated_from": None},
    "WPG": {"name": "Winnipeg Jets", "city": "Winnipeg", "conf": "Western", "div": "Central", "active": 1, "color1": "#041E42", "color2": "#004C97", "current_names": {"Winnipeg Jets"}, "relocated_from": "Atlanta Thrashers (1999–2011)"},
    "WSH": {"name": "Washington Capitals", "city": "Washington", "conf": "Eastern", "div": "Metropolitan", "active": 1, "color1": "#C8102E", "color2": "#041E42", "current_names": {"Washington Capitals"}, "relocated_from": None},
    "ARI": {"name": "Arizona Coyotes (1979–2024)", "city": "Phoenix/Arizona", "conf": "Western", "div": "Central", "active": 0, "color1": "#8C2633", "color2": "#E2D6B5", "current_names": {"Arizona Coyotes", "Phoenix Coyotes"}, "relocated_from": "Winnipeg Jets (1979–1996)"},
    "CLE": {"name": "Cleveland Barons / Golden Seals", "city": "Oakland/Cleveland", "conf": "Western", "div": "Smythe", "active": 0, "color1": "#00843D", "color2": "#FFB81C", "current_names": {"Cleveland Barons", "California Golden Seals", "Oakland Seals"}, "relocated_from": "Oakland/California Golden Seals (1967–1976)"},
}

def evaluate_coach_phallic(cid: str, full_name: str):
    parts = full_name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""
    low_full = full_name.lower()
    low_last = last_name.lower()
    low_first = first_name.lower()

    matched_rules = []
    highlights = []
    for r in PHALLIC_RULES:
        rid = r["rule_id"]
        ptype = r["pattern_type"]
        pat = r["pattern"]
        if ptype == "substring":
            if pat in low_full:
                matched_rules.append(rid)
                highlights.append(r["label"])
        elif ptype == "richard":
            if "richard" in low_full and "richardson" not in low_full:
                matched_rules.append(rid)
                highlights.append('"richard"')

    tier = None
    if any(r["tier"] == "strict" and r["rule_id"] in matched_rules for r in PHALLIC_RULES):
        tier = "strict"
    elif matched_rules:
        tier = "broad"

    return matched_rules, highlights, tier

def main():
    # 1. Parse HR Coaches Register
    reg_html = (RAW_DIR / "hr_coaches_register.html").read_text()
    hr_coaches = {}
    row_pattern = re.compile(
        r'<tr ><th[^>]*data-stat="ranker"[^>]*>\d+</th>'
        r'<td[^>]*data-stat="coach" csk="([^"]+)" >(?:<strong>)?<a href="/coaches/([^"]+)\.html">([^<]+)</a>(?:</strong>)?(\*?)</td>'
        r'<td[^>]*data-stat="year_min" >(\d+)</td>'
        r'<td[^>]*data-stat="year_max" >(\d+)</td>'
        r'<td[^>]*data-stat="years" >(\d+)</td>'
        r'<td[^>]*data-stat="games" >(\d*)</td>'
        r'<td[^>]*data-stat="wins" >(\d*)</td>'
        r'<td[^>]*data-stat="losses" >(\d*)</td>'
        r'<td[^>]*data-stat="ties" >(\d*)</td>'
        r'<td[^>]*data-stat="losses_ot" >(\d*)</td>'
        r'<td[^>]*data-stat="points" >(\d*)</td>'
        r'<td[^>]*data-stat="points_pct" >([^<]*)</td>'
        r'.*?<td[^>]*data-stat="years_cup_champion" >(\d*)</td></tr>'
    )
    for m in row_pattern.finditer(reg_html):
        csk, cid, name, hof, ymin, ymax, yrs, gp, w, l, t, otl, pts, pts_pct, cups = m.groups()
        hr_coaches[cid] = {
            "coach_id": cid,
            "full_name": name.strip(),
            "is_hof": 1 if hof == "*" else 0,
            "year_min": int(ymin),
            "year_max": int(ymax),
            "years": int(yrs),
            "career_gp": int(gp or 0),
            "career_w": int(w or 0),
            "career_l": int(l or 0),
            "career_t": int(t or 0),
            "career_otl": int(otl or 0),
            "career_cups": int(cups or 0),
        }

    # 2. Load NHL API coaches for birthDate & nhl_api_id
    nhl_coaches_raw = json.loads((RAW_DIR / "nhl_coaches.json").read_text())
    nhl_by_name = {c["fullName"].lower(): c for c in nhl_coaches_raw}

    # 3. Parse all 34 franchise season histories
    # Note on WPG vs PHX/ARI vs UTA:
    # In HR's WPG.html, seasons 1979-80 to 1995-96 are the original Winnipeg Jets (which relocated to Phoenix in 1996).
    # Seasons 1999-00 to 2010-11 are the Atlanta Thrashers (which relocated to Winnipeg in 2011).
    # So we assign 1979-80..1995-96 from WPG.html to ARI (as relocated predecessor of ARI),
    # and we also create a combined lineage for UTA if someone includes ARI->UTA relocation, while keeping ARI selectable!
    franchise_season_rows = {k: [] for k in FRANCHISE_META}

    for p in sorted((RAW_DIR / "hr_teams").glob("*.html")):
        code = p.stem
        html = p.read_text()
        for season, lg, team, coaches_html in re.findall(
            r'<tr ><th[^>]*data-stat="season"[^>]*><a[^>]*>([^<]+)</a></th>'
            r'<td[^>]*data-stat="lg_id"[^>]*><a[^>]*>([^<]+)</a></td>'
            r'<td[^>]*data-stat="team_name"[^>]*><a[^>]*>([^<]+)</a>.*?'
            r'<td[^>]*data-stat="coaches"[^>]*>(.*?)</td>',
            html
        ):
            if lg != "NHL":
                continue
            start_yr = int(season[:4])
            if start_yr < 1969:
                continue
            coaches = re.findall(r'<a href="/coaches/([^"]+)\.html">([^<]+)</a>\s*\(([^)]+)\)', coaches_html)
            if code == "WPG" and start_yr <= 1995:
                # Original Winnipeg Jets (1979-1996) -> part of Coyotes/Utah franchise lineage
                franchise_season_rows["UTA"].append((season, "Winnipeg Jets (1979–96)", coaches))
            elif code == "PHX":
                franchise_season_rows["UTA"].append((season, team, coaches))
            else:
                franchise_season_rows[code].append((season, team, coaches))

    # Remove empty ARI entry if all its rows live in UTA lineage
    if not franchise_season_rows.get("ARI"):
        franchise_season_rows.pop("ARI", None)
        FRANCHISE_META.pop("ARI", None)

    # Sort each franchise's seasons chronologically from oldest to newest
    for code in franchise_season_rows:
        franchise_season_rows[code].sort(key=lambda x: int(x[0][:4]))

    # Reorder coaches within multi-coach seasons when a coach clearly bridges from prev season or into next season
    for _pass in range(2):
        for code, srows in franchise_season_rows.items():
            for i in range(len(srows)):
                season, team_name, coaches = srows[i]
                if len(coaches) <= 1 or len([c[0] for c in coaches]) != len(set(c[0] for c in coaches)):
                    continue
                prev_cids = [c[0] for c in srows[i - 1][2]] if i > 0 else []
                next_cids = [c[0] for c in srows[i + 1][2]] if i + 1 < len(srows) else []
                last_prev_cid = prev_cids[-1] if prev_cids else None
                first_next_cid = next_cids[0] if next_cids else None

                def sort_key(item):
                    idx, (cid, short_name, rec) = item
                    if cid == last_prev_cid and cid not in next_cids:
                        return (0, idx)
                    if cid == first_next_cid and cid not in prev_cids:
                        return (2, idx)
                    return (1, idx)

                ordered = [item[1] for item in sorted(enumerate(coaches), key=sort_key)]
                srows[i] = (season, team_name, ordered)

    # Collect all coaches who coached in NHL since 1969-70
    active_2026_cids = set()
    coaches_since_1969 = set()
    for code, srows in franchise_season_rows.items():
        for season, team, coaches in srows:
            for cid, _, _ in coaches:
                coaches_since_1969.add(cid)
                if season == "2026-27":
                    active_2026_cids.add(cid)

    # Build SQLite DB
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE franchises (
        franchise_id TEXT PRIMARY KEY,
        current_name TEXT NOT NULL,
        city TEXT NOT NULL,
        conference TEXT NOT NULL,
        division TEXT NOT NULL,
        is_active INTEGER NOT NULL,
        primary_color TEXT NOT NULL,
        secondary_color TEXT NOT NULL,
        relocated_from TEXT
    );

    CREATE TABLE phallic_rules (
        rule_id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        pattern_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        tier TEXT NOT NULL,
        default_enabled INTEGER NOT NULL,
        description TEXT NOT NULL
    );

    CREATE TABLE coaches (
        coach_id TEXT PRIMARY KEY,
        nhl_api_id INTEGER,
        full_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        legal_first_name TEXT NOT NULL,
        birth_date TEXT,
        year_min INTEGER NOT NULL,
        year_max INTEGER NOT NULL,
        is_active INTEGER NOT NULL,
        is_hof INTEGER NOT NULL,
        career_gp INTEGER NOT NULL,
        career_w INTEGER NOT NULL,
        career_l INTEGER NOT NULL,
        career_t_otl INTEGER NOT NULL,
        career_cups INTEGER NOT NULL,
        is_phallic_default INTEGER NOT NULL,
        is_phallic_core INTEGER NOT NULL,
        is_phallic_broad INTEGER NOT NULL,
        phallic_tier TEXT,
        phallic_matches_json TEXT NOT NULL,
        phallic_highlights_json TEXT NOT NULL
    );

    CREATE TABLE coaching_stints (
        stint_id INTEGER PRIMARY KEY AUTOINCREMENT,
        franchise_id TEXT NOT NULL,
        team_name TEXT NOT NULL,
        is_current_identity INTEGER NOT NULL,
        coach_id TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        stint_seq INTEGER NOT NULL,
        coach_franchise_stint_num INTEGER NOT NULL,
        start_season TEXT NOT NULL,
        end_season TEXT NOT NULL,
        start_year INTEGER NOT NULL,
        end_year INTEGER NOT NULL,
        seasons_count INTEGER NOT NULL,
        games_coached INTEGER NOT NULL,
        wins INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        ties_otl INTEGER NOT NULL,
        points_pct REAL NOT NULL,
        is_interim INTEGER NOT NULL,
        is_active_stint INTEGER NOT NULL,
        FOREIGN KEY (franchise_id) REFERENCES franchises(franchise_id),
        FOREIGN KEY (coach_id) REFERENCES coaches(coach_id)
    );

    CREATE TABLE coach_seasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        franchise_id TEXT NOT NULL,
        season TEXT NOT NULL,
        season_start_year INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        is_current_identity INTEGER NOT NULL,
        seq_in_season INTEGER NOT NULL,
        total_coaches_in_season INTEGER NOT NULL,
        coach_id TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        games INTEGER NOT NULL,
        wins INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        ties_otl INTEGER NOT NULL
    );
    """)

    for r in PHALLIC_RULES:
        cur.execute(
            "INSERT INTO phallic_rules VALUES (?, ?, ?, ?, ?, ?, ?)",
            (r["rule_id"], r["label"], r["pattern_type"], r["pattern"], r["tier"], r["default_enabled"], r["description"])
        )

    for fid, meta in FRANCHISE_META.items():
        cur.execute(
            "INSERT INTO franchises VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (fid, meta["name"], meta["city"], meta["conf"], meta["div"], meta["active"], meta["color1"], meta["color2"], meta["relocated_from"])
        )

    for cid in sorted(coaches_since_1969):
        c = hr_coaches[cid]
        full_name = c["full_name"]
        parts = full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""
        legal_first = "Richard" if cid in RICHARD_FIRST_NAME_COACH_IDS else first_name
        nhl_info = nhl_by_name.get(full_name.lower(), {})
        birth_date = (nhl_info.get("birthDate") or "")[:10] or None
        nhl_id = nhl_info.get("id")

        matched_rules, highlights, tier = evaluate_coach_phallic(cid, full_name)
        is_core = 1 if tier == "strict" else 0
        is_default = 1 if tier == "strict" else 0
        is_broad = 1 if tier in ("strict", "broad") else 0

        cur.execute(
            "INSERT INTO coaches VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                cid, nhl_id, full_name, first_name, last_name, legal_first, birth_date,
                c["year_min"], c["year_max"], 1 if cid in active_2026_cids else 0, c["is_hof"],
                c["career_gp"], c["career_w"], c["career_l"], c["career_t"] + c["career_otl"],
                c["career_cups"], is_default, is_core, is_broad, tier,
                json.dumps(matched_rules), json.dumps(highlights)
            )
        )

    # Insert coach_seasons and construct coaching_stints per franchise
    for fid, srows in franchise_season_rows.items():
        current_names = FRANCHISE_META[fid]["current_names"]
        stints = []
        for season, team_name, coaches in srows:
            start_yr = int(season[:4])
            end_yr = start_yr + 1
            is_curr_id = 1 if team_name in current_names else 0
            for c_idx, (cid, short_name, rec) in enumerate(coaches):
                nums = [int(x) for x in rec.split("-")]
                w = nums[0] if len(nums) > 0 else 0
                l = nums[1] if len(nums) > 1 else 0
                t_otl = sum(nums[2:]) if len(nums) > 2 else 0
                gp = w + l + t_otl
                full_name = hr_coaches[cid]["full_name"]

                cur.execute(
                    "INSERT INTO coach_seasons (franchise_id, season, season_start_year, team_name, is_current_identity, seq_in_season, total_coaches_in_season, coach_id, coach_name, games, wins, losses, ties_otl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (fid, season, start_yr, team_name, is_curr_id, c_idx + 1, len(coaches), cid, full_name, gp, w, l, t_otl)
                )

                if stints and stints[-1]["coach_id"] == cid and stints[-1]["end_year"] in (start_yr, start_yr - 1):
                    prev = stints[-1]
                    prev["end_season"] = season
                    prev["end_year"] = end_yr
                    prev["seasons_count"] += 1
                    prev["games_coached"] += gp
                    prev["wins"] += w
                    prev["losses"] += l
                    prev["ties_otl"] += t_otl
                    if is_curr_id:
                        prev["is_current_identity"] = 1
                        prev["team_name"] = team_name
                else:
                    stints.append({
                        "franchise_id": fid,
                        "team_name": team_name,
                        "is_current_identity": is_curr_id,
                        "coach_id": cid,
                        "coach_name": full_name,
                        "start_season": season,
                        "end_season": season,
                        "start_year": start_yr,
                        "end_year": end_yr,
                        "seasons_count": 1,
                        "games_coached": gp,
                        "wins": w,
                        "losses": l,
                        "ties_otl": t_otl,
                        "started_midseason": c_idx > 0,
                    })

        coach_counts = {}
        for idx, st in enumerate(stints):
            cid = st["coach_id"]
            coach_counts[cid] = coach_counts.get(cid, 0) + 1
            gp = st["games_coached"]
            pts = st["wins"] * 2 + st["ties_otl"]
            pts_pct = round(pts / (gp * 2), 4) if gp > 0 else 0.0
            is_active_stint = 1 if st["end_season"] == "2026-27" and idx == len(stints) - 1 else 0
            is_interim = 1 if (
                (st["seasons_count"] == 1 and st["started_midseason"] and not is_active_stint and gp <= 55)
                or cid == "bench01c"
                or (gp <= 10 and not is_active_stint)
            ) else 0

            cur.execute(
                """INSERT INTO coaching_stints (
                    franchise_id, team_name, is_current_identity, coach_id, coach_name,
                    stint_seq, coach_franchise_stint_num, start_season, end_season,
                    start_year, end_year, seasons_count, games_coached, wins, losses,
                    ties_otl, points_pct, is_interim, is_active_stint
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    fid, st["team_name"], st["is_current_identity"], cid, st["coach_name"],
                    idx + 1, coach_counts[cid], st["start_season"], st["end_season"],
                    st["start_year"], st["end_year"], st["seasons_count"], gp,
                    st["wins"], st["losses"], st["ties_otl"], pts_pct, is_interim, is_active_stint
                )
            )

    conn.commit()
    print("SQLite database built at:", DB_PATH)

    # Export JSON bundle for frontend
    out_json_dir = Path("src/data")
    out_json_dir.mkdir(parents=True, exist_ok=True)

    franchises_list = [dict(r) for r in cur.execute("SELECT * FROM franchises ORDER BY is_active DESC, current_name ASC")]
    rules_list = [dict(r) for r in cur.execute("SELECT * FROM phallic_rules")]
    coaches_list = []
    for r in cur.execute("SELECT * FROM coaches ORDER BY full_name ASC"):
        d = dict(r)
        d["phallic_matches"] = json.loads(d.pop("phallic_matches_json"))
        d["phallic_highlights"] = json.loads(d.pop("phallic_highlights_json"))
        coaches_list.append(d)
    stints_list = [dict(r) for r in cur.execute("SELECT * FROM coaching_stints ORDER BY franchise_id, stint_seq")]

    season_coaches = {}
    for r in cur.execute("SELECT DISTINCT season, coach_id FROM coach_seasons ORDER BY season, coach_id"):
        season_coaches.setdefault(r["season"], []).append(r["coach_id"])

    bundle = {
        "generatedAt": "2026-10-17",
        "seasonThrough": "2026-27",
        "franchises": franchises_list,
        "rules": rules_list,
        "coaches": coaches_list,
        "stints": stints_list,
        "seasonCoaches": season_coaches,
    }
    out_json_path = out_json_dir / "nhlData.json"
    out_json_path.write_text(json.dumps(bundle, indent=2))
    print(f"Exported frontend bundle to {out_json_path} ({out_json_path.stat().st_size} bytes)")

if __name__ == "__main__":
    main()

