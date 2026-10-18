import json
import urllib.parse
import urllib.request
from pathlib import Path

RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {"User-Agent": "OilersCoachStats/1.0 (https://example.com; contact@example.com)"}

def fetch_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def main():
    print("Fetching NHL franchises...")
    franchises = fetch_json("https://records.nhl.com/site/api/franchise")["data"]
    (RAW_DIR / "nhl_franchises.json").write_text(json.dumps(franchises, indent=2))
    print(f"Saved {len(franchises)} franchises.")

    print("Fetching NHL coaches...")
    coaches = fetch_json("https://records.nhl.com/site/api/coach")["data"]
    (RAW_DIR / "nhl_coaches.json").write_text(json.dumps(coaches, indent=2))
    print(f"Saved {len(coaches)} coaches.")

    print("Fetching NHL coach-franchise-records (regular season)...")
    cfr = fetch_json("https://records.nhl.com/site/api/coach-franchise-records?cayenneExp=gameTypeId=2")["data"]
    (RAW_DIR / "nhl_coach_franchise_records.json").write_text(json.dumps(cfr, indent=2))
    print(f"Saved {len(cfr)} coach-franchise records.")

    print("Fetching NHL teams...")
    teams = fetch_json("https://records.nhl.com/site/api/team")["data"]
    (RAW_DIR / "nhl_teams.json").write_text(json.dumps(teams, indent=2))
    print(f"Saved {len(teams)} teams.")

if __name__ == "__main__":
    main()
