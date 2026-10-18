import shutil
import time
import urllib.request
from pathlib import Path

RAW_DIR = Path("data/raw")
HR_TEAMS_DIR = RAW_DIR / "hr_teams"
HR_TEAMS_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
}

ACTIVE_FRANCHISES = [
    "ANA", "BOS", "BUF", "CGY", "CAR", "CHI", "COL", "CBJ",
    "DAL", "DET", "EDM", "FLA", "LAK", "MIN", "MTL", "NSH",
    "NJD", "NYI", "NYR", "OTT", "PHI", "PIT", "SJS", "SEA",
    "STL", "TBL", "TOR", "UTA", "VAN", "VEG", "WSH", "WPG"
]

DEFUNCT_NHL_FRANCHISES_SINCE_1970 = [
    "PHX", "CLE"
]

def main():
    # Copy already fetched NHL_stats.html and EDM/history.html if available
    step77 = Path("/Users/spencer/.gemini/antigravity/brain/05fa89f4-54a5-456f-ba20-7ae92d6a29f1/.system_generated/steps/77/content.md")
    if step77.exists():
        shutil.copy(step77, RAW_DIR / "hr_coaches_register.html")
        print("Copied hr_coaches_register.html")

    step89 = Path("/Users/spencer/.gemini/antigravity/brain/05fa89f4-54a5-456f-ba20-7ae92d6a29f1/.system_generated/steps/89/content.md")
    if step89.exists():
        shutil.copy(step89, HR_TEAMS_DIR / "EDM.html")
        print("Copied EDM.html")

    all_codes = [(c, f"https://www.hockey-reference.com/teams/{c}/history.html") for c in ACTIVE_FRANCHISES] + [
        (c, f"https://www.hockey-reference.com/teams/{c}/") for c in DEFUNCT_NHL_FRANCHISES_SINCE_1970
    ]

    for code, url in all_codes:
        out_path = HR_TEAMS_DIR / f"{code}.html"
        if out_path.exists() and out_path.stat().st_size > 10000:
            print(f"[SKIP] {code} already cached ({out_path.stat().st_size} bytes)")
            continue
        print(f"Fetching {code} from {url} ...")
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                html = r.read().decode("utf-8", errors="ignore")
                out_path.write_text(html)
                print(f"  Saved {code}.html ({len(html)} bytes)")
        except Exception as e:
            print(f"  ERROR fetching {code}: {e}")
        time.sleep(2.1)

if __name__ == "__main__":
    main()
