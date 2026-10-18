# The Phallic Bench Boss Index 🏒🔥

An interactive statistical analysis and probability explorer of **NHL Head Coach Names (1970–2027)** across all 32 NHL franchises, backed by a SQLite database (`data/nhl_coaches.db`) and a static React + TypeScript web application.

## The Motivation

Starting in the 2018–19 season, the **Edmonton Oilers** hired five consecutive head coaches whose names contain a phallic substring:

1. **Ken Hitchcock** (`"cock"`, 2018–19)
2. **Dave Tippett** (`"tip"`, 2019–22)
3. **Jay Woodcroft** (`"wood"`, 2021–24)
4. **Kris Knoblauch** (`"knob"`, 2023–26)
5. **Mike Babcock** (`"cock"`, 2026–27)

Is a 5-coach sequential streak like this just a coincidence, or is it statistically unlikely to happen by random chance? And how does every other NHL franchise compare on the bottom-line question: ***"Are the [Team] obsessed with hiring coaches with phallic names?"***

---

## Key Statistical Findings (Default `Strict` Corpus, 1970–2027)

Across all **322 unique NHL head coaches** and **650 coaching stints** since 1970:

- **Unique Coach Base Rate ($p_{\text{unique}}$)**: **15 / 322 (`4.66%`)** of NHL head coaches match the default **Strict** dictionary.
- **Hiring Event Base Rate ($p_{\text{stints}}$)**: **40 / 650 (`6.15%`)** of all coaching hires match, because NHL teams frequently recycle veteran coaches with phallic names (e.g., Peter Laviolette, Peter DeBoer, Ken Hitchcock, Mike Babcock, Dave Tippett).

Even using the higher, more conservative **6.15% Hiring Event Base Rate**, the odds of the Edmonton Oilers' 5-coach streak are:

| Probability Lens | Formula / Method | Probability | Odds ("1 in X") | Statistically Significant ($p < 0.05$)? |
| :--- | :--- | :--- | :--- | :--- |
| **1. Specific 5-Hire Streak** | $p^5 = (0.06154)^5$ | `0.000088%` | **1 in 1,133,096** | ✅ Yes ($p \ll 0.0001$) |
| **2. Any 5-Streak in Oilers History** | Exact 6-State Absorbing Markov Chain ($N = 23$ hires) | `0.00158%` | **1 in 63,329** | ✅ Yes ($p \ll 0.001$) |
| **3. Any Team in the 32-Team League** | $1 - \prod_{i=1}^{32} (1 - P_{\text{Markov}}(N_i, 5, p))$ | `0.052%` | **1 in 1,923** | ✅ Yes ($p = 0.00052$) |
| **4. Cumulative Binomial Volume** | $P(\text{Binomial}(23, p) \ge 7)$ | `0.046%` | **1 in 2,175** | ✅ Yes ($p = 0.00046$) |

---

## Phallic Name Classification Dictionary

Users can expand the **Name Rules** drawer in the top Parameters bar to toggle individual rules, add custom substrings, or switch between two presets:

### 1. `Strict` Category (Enabled by Default — 15 Coaches)
- **`"cock"`**: Ken Hitchcock, Mike Babcock
- **`"tip"`**: Dave Tippett
- **`"wood"`**: Jay Woodcroft
- **`"knob"`**: Kris Knoblauch
- **`"dick"`**: Dick Duff
- **`"rod"`**: Rod Brind'Amour
- **`"willie"`**: Willie Desjardins
- **`"johnson"`**: Bob Johnson, Tom Johnson
- **`"peter"`**: Peter DeBoer, Peter Horachek, Peter Laviolette, Bill Peters
- **`"creamer"`**: Pierre Creamer

### 2. `Broad` Category (Extended & Double-Entendres — 22 Coaches Total)
Adds:
- **`"richard"`**: Todd Richards (traditional source of nickname `"Dick"`)
- **`"johnston"`**: Eddie Johnston, Marshall Johnston, Mike Johnston
- **`"bush"`**: Eddie Bush
- **`"long"`**: Barry Long
- **`"sacco"`**: Joe Sacco

---

## Shareable URL Parameters

Every control in the UI is synchronized with the URL query string so any custom view can be shared directly:

| Parameter | Values / Examples | Description |
| :--- | :--- | :--- |
| `team` | `EDM`, `TOR`, `NYR`, `CAR`, ... | Selected NHL franchise abbreviation |
| `preset` | `strict` (default), `broad`, `custom` | Dictionary preset mode |
| `rules` | `cock,tip,wood,knob,...` | Comma-separated rule IDs when `preset=custom` |
| `custom` | `bone,horn,...` | Comma-separated user-supplied custom substrings |
| `base` | `stints` (default), `unique` | Baseline probability $p$ (Hiring Events vs. Unique Coaches) |
| `metric` | `history` (default), `streak`, `binomial` | Primary probability lens displayed in the hero verdict |
| `interim` | `1` (default) or `0` | Include or exclude interim head coaches |
| `relocated` | `1` (default) or `0` | Include or exclude pre-relocation franchise history (e.g., Whalers $\to$ Hurricanes) |
| `repeats` | `1` (default) or `0` | Count repeat coaching stints with the same team separately |
| `since` | `1970` (default), `1979`, `1990`, `2000`, `2010`, `2018` | Starting year filter |
| `tab` | `analysis`, `leaderboard`, `corpus`, `primer` | Active navigation tab |

---

## Project Structure & Data Pipeline

```text
├── data/
│   └── nhl_coaches.db            # SQLite database (franchises, coaches, coaching_stints, coach_seasons, phallic_rules)
├── scripts/
│   ├── explore_data.py           # Fetches NHL Records REST API metadata
│   ├── fetch_hr_data.py          # Fetches Hockey-Reference coach register & all 34 franchise season pages
│   └── build_database.py         # Builds data/nhl_coaches.db and exports src/data/nhlData.json
├── src/
│   ├── components/
│   │   ├── TeamVerdictHero.tsx   # Bottom-line "Are they obsessed?" hero banner & probability cards
│   │   ├── CoachingTimeline.tsx  # Sequential hiring barcode & chronological coaching cards
│   │   ├── LeagueLeaderboard.tsx # Sortable 32-team obsession leaderboard
│   │   ├── CorpusExplorer.tsx    # Searchable 322-coach SQLite corpus browser
│   │   ├── StatsPrimer.tsx       # Plain-English statistical explainer
│   │   └── HighlightedName.tsx   # Substring badge highlighter for coach names
│   ├── data/
│   │   └── nhlData.json          # Pre-bundled static export from SQLite
│   ├── utils/
│   │   ├── statsEngine.ts        # Live Markov chain, Binomial tail, Hypergeometric & Look-Elsewhere math
│   │   └── urlParams.ts          # Bidirectional URL query string serializer/parser
│   ├── App.tsx
│   └── types.ts
└── .github/workflows/deploy.yml  # Automatic GitHub Pages deployment
```

---

## Local Development

### 1. Install Frontend Dependencies & Start Dev Server

```bash
npm install
npm run dev
```

### 2. Query or Rebuild the SQLite Database

You can inspect the SQLite database directly using `sqlite3`:

```bash
sqlite3 data/nhl_coaches.db "SELECT coach_name, start_season, end_season, games_coached FROM coaching_stints WHERE franchise_id = 'EDM' ORDER BY stint_seq;"
```

To rebuild `data/nhl_coaches.db` and `src/data/nhlData.json`:

```bash
python3 scripts/build_database.py
```

### 3. Build Static Bundle for Production / GitHub Pages

```bash
npm run build
```
