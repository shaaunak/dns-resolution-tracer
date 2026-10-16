# DNS Resolution Tracer & Visualizer (dnstrace)

A Computer Networks engineering project that reveals how a domain name is **iteratively resolved** across the real global DNS hierarchy, step by step.

Given any domain (such as `google.com`) and DNS record type (`A`, `AAAA`, `CNAME`, `NS`, `MX`, `TXT`), the application bypasses local recursive operating system stubs and executes true iterative resolution starting directly from the **IANA Root Hints** down through the **Top-Level Domain (TLD)** nameservers to the **Authoritative** nameservers. It tracks every hop, packet round-trip time, transport protocol, referral, glue record, and application cache state, paired with an interactive 3D tiered celestial visualization and step-by-step wire ledger.

> **Note on Caching**: The cache visualized in this application is the application's own in-memory TTL-aware cache (`key = domain + record_type`). The resolver queries authoritative infrastructure directly and does not infer external third-party intermediate caches.

---

## Key Features

### 1. Real Iterative Resolver Engine
- **True Iterative Resolution**: Starts at the IANA Root nameservers (`a.root-servers.net` to `m.root-servers.net`), follows referrals through TLD nameservers, and queries the authoritative nameservers for the final answer.
- **Glue Record Resolution**: Automatically parses and prioritizes IPv4/IPv6 glue records in the `ADDITIONAL` section. When referrals lack glue records, the engine autonomously spawns sub-resolutions to resolve the nameserver's own address before proceeding.
- **CNAME Chain Following**: Follows CNAME aliases sequentially to their canonical target, equipped with recursion depth limits and loop detection.
- **Dual Transport Protocols**: Queries over UDP with automatic TCP fallback upon message truncation (`TC=1`).
- **EDNS0 Support**: Uses Extension Mechanisms for DNS (RFC 6891) with standard **1232-byte** buffer sizes to avoid UDP fragmentation.
- **Accurate Per-Hop Timing**: High-resolution latency measurement (in milliseconds) for each remote nameserver round trip.

### 2. Hard Engine Safety Limits
To prevent denial-of-service, runaway recursion, or cyclic loops in misconfigured zones, the engine enforces strict guardrails:
- **Max CNAME Hops**: 8 aliases
- **Max Referrals**: 16 delegation referrals
- **Max Nested NS Lookups**: 3 recursion levels for nameserver names without glue
- **Max Queries per Trace**: 40 queries total budget
- **Query Timeout**: 3.0 seconds per server attempt

### 3. Interactive 3D Tiered Cartography
- **3D Celestial Visualization**: Powered by Three.js and React Three Fiber (`@react-three/fiber`), rendering a 3D canvas mapping:
  - **Tier 1 (Top)**: Cluster of 13 IANA root server nodes
  - **Tier 2 (Middle)**: Ring of 13 `.com` TLD nodes
  - **Tier 3 (Bottom)**: 4 Authoritative nameserver nodes
- **Active Trajectory & Travelling Packet**: A curved spline links the exact servers hit during the query, with a traveling packet animating through the hierarchy.
- **Performance & Fallback**: Lazy-loaded 3D chunk, capped `devicePixelRatio <= 2`, rendering paused when offscreen/hidden, and an architectural blueprint SVG fallback for reduced-motion or environments without WebGL.

### 4. Application-Level TTL Cache
- **In-Memory TTL Cache**: Keyed on `(domain, record_type)` with expiration timestamps calculated from record TTLs.
- **Honest Performance Comparison**: Detects cache **HIT** vs **MISS** and computes speedup metrics (`N x faster`) strictly when a prior live trace for that exact query exists in the active browser session.
- **Cache Management**: One-click **Clear Cache** button and dedicated REST endpoint `POST /api/cache/clear`.

### 5. Detailed Step & Record Tables
- **Full Section Parsing**: Expandable accordions for the `ANSWER`, `AUTHORITY` (NS delegation), and `ADDITIONAL` (glue IP) sections.
- **Server Role Badging**: Visual tags for `ROOT`, `TLD`, `AUTHORITATIVE`, and `APP CACHE`.
- **Per-Hop Latency Waterfall**: Comparative horizontal bar chart showing exactly where time went across the resolution path.
- **Preset Quick-Tests**: Instant one-click presets for popular configurations (`google.com`, `cloudflare.com`, `github.com`, `www.github.com`, `bbc.co.uk`, `nonexistent.xyz`, `bad domain!!`).
- **Export Tools**: One-click **Copy JSON** and **Copy Summary** for lab reports and debugging.

### 6. Robust Structured Error Handling
- Returns structured diagnostic codes without leaking raw stack traces:
  `INVALID_DOMAIN`, `INVALID_RECORD_TYPE`, `NXDOMAIN`, `NODATA`, `SERVFAIL`, `REFUSED`, `TIMEOUT`, `NETWORK_ERROR`, `PARSE_ERROR`, `CNAME_LOOP`, `MAX_DEPTH_EXCEEDED`, `NO_NAMESERVERS`, `INTERNAL_ERROR`.

---

## Architecture & Resolution Flow

```text
       +--------------------------------------------------------+
       |                  Client Browser (UI)                   |
       +--------------------------------------------------------+
                         |                           ^
              POST /api/trace                  TraceResult JSON
                         v                           |
       +--------------------------------------------------------+
       |                  FastAPI Backend Server                |
       |  +--------------------+       +---------------------+  |
       |  |  TTL Memory Cache  | <---> |  Validation Layer   |  |
       |  +--------------------+       +---------------------+  |
       |                     \           /                      |
       |                   Iterative Resolver                   |
       +--------------------------------------------------------+
                  |                  |                  |
           Step 1: Root      Step 2: TLD        Step 3: Auth
             Query              Query              Query
                  v                  v                  v
         +----------------+  +----------------+  +---------------+
         | [a-m].root-    |  | [a-m].gtld-    |  | ns[1-4].      |
         | servers.net    |  | servers.net    |  | google.com    |
         | (Root Hints)   |  | (.com Referral)|  | (Final Answer)|
         +----------------+  +----------------+  +---------------+
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend Engine** | Python 3.14+, FastAPI, Uvicorn, dnspython, Pydantic v2 |
| **Backend Testing** | pytest, httpx (TestClient) |
| **Frontend UI** | React 19, Vite, Three.js, @react-three/fiber |
| **Styling & Design System** | Bordeaux Editorial & Ivory Precision design system (CSS3 Grid/Flexbox, hairlines, Newsreader, Inter, JetBrains Mono) |

---

## Project Structure

```text
dns-tracer/
├── backend/
│   ├── main.py              # FastAPI application, CORS, error handlers, and endpoints
│   ├── models.py            # Pydantic data schemas and ErrorCode definitions
│   ├── cache.py             # TTL-aware in-memory application cache
│   ├── engine/
│   │   ├── roots.py         # IANA root server addresses (hints)
│   │   ├── transport.py     # Low-level UDP/TCP socket query transport with EDNS0 (1232B)
│   │   ├── validation.py    # RFC domain and record type validation rules
│   │   ├── records.py       # DNS message parser (Answer, Authority, Additional)
│   │   ├── resolver.py      # Core iterative resolution algorithm and guardrail limits
│   │   └── tracer.py        # Orchestrates the trace and records diagnostic steps
│   ├── tests/               # 105+ unit and live network integration tests
│   ├── smoke_step3.py       # Standalone CLI resolution tool
│   ├── pytest.ini           # Pytest configuration
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── index.html           # Single-page HTML entry point (Newsreader, Inter, JetBrains Mono)
│   ├── vite.config.js       # Vite bundler configuration
│   ├── package.json         # Node.js dependencies and build scripts
│   └── src/
│       ├── App.jsx          # Root application component and routing
│       ├── main.jsx         # React DOM bootstrap
│       ├── index.css        # Design tokens, variables, typography, and card styles
│       ├── context/
│       │   └── RouterContext.jsx  # Zero-dependency path-based router & Link
│       ├── services/
│       │   └── api.js       # Backend REST client (getHealth, traceDomain, clearCache)
│       ├── fixtures/
│       │   └── realTraceFixture.json # Captured real trace fixture for baseline display
│       ├── views/
│       │   ├── LandingPage.jsx   # Hero with 3D tiered visualization and sequence guide
│       │   ├── TracerPage.jsx    # Interactive query console and horizontal hop graph
│       │   └── LearnPage.jsx     # Protocol walkthrough and interactive trace replayer
│       └── components/
│           ├── Navbar.jsx            # Sticky header with real backend health pill
│           ├── Footer.jsx            # Footer with RFC specifications and repo links
│           ├── TieredHeroCanvas.jsx  # Three.js 3D tiered hierarchy cartography
│           ├── BlueprintPoster.jsx   # SVG blueprint fallback for reduced motion / non-WebGL
│           ├── HopGraph.jsx          # Centerpiece horizontal traversal topology
│           ├── SummaryMetrics.jsx    # 4 metrics cards with active TTL countdown
│           ├── AnswerTable.jsx       # Validated authoritative answer record table
│           ├── StepLedger.jsx        # Step card accordions with wire header inspect
│           ├── LatencyWaterfall.jsx  # Per-hop latency bar chart
│           └── ErrorCard.jsx         # Structured error card for all 13 ErrorCodes
└── README.md
```

---

## API Endpoints

Interactive Swagger documentation is automatically hosted at **`http://127.0.0.1:8000/docs`** when the backend is running.

### 1. `GET /api/health`
Checks backend engine status, uptime, and cache statistics.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "dns-tracer",
  "uptime_s": 142.5,
  "cache": {
    "entries": 3,
    "hits": 7,
    "misses": 4
  }
}
```

### 2. `POST /api/trace`
Executes an iterative DNS trace for a specified domain and record type.

**Request:**
```json
{
  "domain": "google.com",
  "record_type": "A"
}
```

**Response (200 OK):**
```json
{
  "domain": "google.com",
  "record_type": "A",
  "final_answer": [
    { "name": "google.com.", "type": "A", "ttl": 300, "value": "142.250.190.46" }
  ],
  "total_time_ms": 182.4,
  "cache_hit": false,
  "ttl": 300,
  "steps": [
    {
      "step": 1,
      "server": "192.203.230.10",
      "server_name": "e.root-servers.net",
      "server_type": "ROOT",
      "query": "google.com",
      "record_type": "A",
      "response": "REFERRAL",
      "rcode": "NOERROR",
      "authoritative": false,
      "response_time_ms": 32.1,
      "transport": "UDP"
    }
  ],
  "error": null
}
```

### 3. `POST /api/cache/clear`
Clears all active in-memory cache records.

**Response (200 OK):**
```json
{
  "cleared": 3,
  "message": "Application DNS cache cleared"
}
```

---

## Getting Started

### Prerequisites
- **Python 3.14+** (Python 3.10+ also supported)
- **Node.js 18+** with `npm`
- **Internet Access**: The backend requires outbound access on **UDP and TCP port 53** to perform live DNS queries. (Ensure local firewall or VPN policies do not restrict direct port 53 access).

---

### Installation & Local Run

#### Terminal 1 — Start the Backend Server

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
*The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).*

#### Terminal 2 — Start the Frontend Visualizer

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will launch at [http://localhost:5173](http://localhost:5173).*

---

## How to Demo

Follow this step-by-step sequence to demonstrate the project's core capabilities:

1. **Start Services**: Run the backend on port 8000 and frontend on port 5173. Note the green **Backend connected** health pill in the navbar.
2. **Explore Landing Page (`/`)**:
   - Inspect the 3D Tiered Cartography on the right (13 Root nodes, 13 .com TLD nodes, 4 Authoritative nodes).
   - Review the **Execution Sequence** (Root Hints → TLD Referral → Authoritative Answer → Caching).
   - Review the **Protocol Disassembly** (Header flags QR=1, AA=1, TC=0, RD=0 iterative, EDNS0 1232 octets).
3. **Run a Standard Trace (`/trace`)**:
   - Query `google.com` (Record Type: `A`).
   - Observe the **Iterative Traversal Topology**: Hop 1 Root → Hop 2 TLD → Hop 3 Authoritative → Final Answer.
   - Note the **CACHE MISS** indicator with live round-trip latency.
   - Inspect the **Validated Authoritative Answer** table showing all IPv4 address records.
   - Expand the **Iterative Query Ledger** to inspect wire headers and Authority/Additional glue records for each hop.
4. **Demonstrate Cache Acceleration**:
   - Click the **Trace again (Warm cache)** button for `google.com`.
   - Observe the **CACHE HIT** banner: resolution time drops to ~4ms, queries sent becomes 0, and the **N x FASTER** comparative speedup is displayed.
   - Click **Clear Cache** in the console: verify the toast reports cleared entries.
   - Trace again: verify it returns to a live **CACHE MISS**.
5. **Demonstrate CNAME Following**:
   - Click the preset `www.github.com (CNAME)`.
   - Observe the resolver following the canonical alias chain to `github.com`.
6. **Demonstrate Negative & Error Outcomes**:
   - Click preset `nonexistent.xyz (NXDOMAIN)`: observe the authoritative server returning `NXDOMAIN` with friendly diagnostics.
   - Click preset `bad domain!! (INVALID)`: observe RFC syntax validation error.
7. **Educational Replay (`/learn`)**:
   - Open **Protocol Walkthrough**. Step through the real trace replay hop-by-hop with detailed educational explanations.

---

## Testing & Verification

All automated tests live inside `backend/tests/`.

### 1. Offline Test Suite (Default)
Runs over **105 offline unit tests** validating parser logic, validation rules, referral handling, CNAME chain processing, error classification, and cache algorithms using mocked socket responses:

```bash
cd backend
source .venv/bin/activate
python -m pytest
```

### 2. Live Network Integration Tests
Sends real queries to live IANA root, TLD, and authoritative nameservers over the public internet:

```bash
python -m pytest -m live
```

### 3. Standalone CLI Smoke Test
Execute a direct CLI trace without opening the browser:

```bash
python smoke_step3.py google.com A
```

---

## License

This project is open-source under the [MIT License](LICENSE).