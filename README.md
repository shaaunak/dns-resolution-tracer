# DNS Resolution Tracer & Visualizer

A Computer Networks engineering project that reveals how a domain name is **iteratively resolved** across the real global DNS hierarchy, step by step.

Given any domain (such as `google.com`) and DNS record type (`A`, `AAAA`, `CNAME`, `NS`, `MX`, `TXT`), the application bypasses local recursive operating system stubs and executes true iterative resolution starting directly from the **IANA Root Hints** down through the **Top-Level Domain (TLD)** nameservers to the **Authoritative** nameservers. It tracks every hop, packet round-trip time, transport protocol, referral, glue record, and application cache state, paired with an interactive 3D celestial visualization and packet flow simulator.

> **Note on Caching**: The cache visualized in this application is the application's own in-memory TTL-aware cache. The resolver queries authoritative infrastructure directly and does not infer external third-party intermediate caches.

---

## Key Features

### 1. Real Iterative Resolver Engine
- **True Iterative Resolution**: Starts at the IANA Root nameservers (`a.root-servers.net` to `m.root-servers.net`), follows referrals through TLD nameservers, and queries the authoritative nameservers for the final answer.
- **Glue Record Resolution**: Automatically parses and prioritizes IPv4/IPv6 glue records in the `ADDITIONAL` section. When referrals lack glue records, the engine autonomously spawns sub-resolutions to resolve the nameserver's own address before proceeding.
- **CNAME Chain Following**: Follows CNAME aliases sequentially to their canonical target, equipped with recursion depth limits (`MAX_DEPTH = 10`) and loop detection (`CNAME_LOOP`).
- **Dual Transport Protocols**: Queries over UDP with automatic TCP fallback upon message truncation (`TC=1`).
- **EDNS0 Support**: Uses Extension Mechanisms for DNS (RFC 6891) with standard 4096-byte buffer sizes.
- **Accurate Per-Hop Timing**: High-resolution latency measurement (in milliseconds) for each remote nameserver round trip.

### 2. Interactive 3D Orbital & Blueprint Visualizer
- **3D Celestial Visualization**: Powered by Three.js and React Three Fiber (`@react-three/fiber`, `@react-three/drei`), rendering a 3D orbital canvas mapping Client → Root Cluster → TLD Cluster → Authoritative Nameservers.
- **Interactive Inspection**: Orbit, pan, zoom, and hover over specific nameserver nodes to inspect hop metadata, IP addresses, and response latencies in real time.
- **Swiss Blueprint Aesthetic**: High-contrast, typographic UI design system inspired by Swiss engineering schematics with dark-mode data density.

### 3. Interactive DNS Simulator & Educational Primer
- **Packet Flow Simulator**: Step-through interactive packet simulator allowing students and engineers to visualize each request/response frame sequentially.
- **Interactive Story Mode (ScrollStory)**: Educational walkthrough explaining the mechanics of root hints, zone delegation, DNS hierarchy, and record types.
- **Protocol Deep-Dive**: Built-in modal reference explaining RFC standards, header flags (QR, AA, TC, RD, RA, RCODE), and query mechanics.

### 4. Application-Level TTL Cache
- **In-Memory TTL Cache**: Keyed on `(domain, record_type)` with expiration timestamps calculated from record TTLs.
- **Performance Comparison**: Detects cache **HIT** vs **MISS** and automatically computes speedup metrics (e.g., `48.2x faster` than the previous live network round-trip).
- **Cache Management**: One-click **CLEAR CACHE** button and dedicated REST endpoint `/api/cache/clear`.

### 5. Detailed Step & Record Tables
- **Full Section Parsing**: Expandable accordions for the `ANSWER`, `AUTHORITY` (NS delegation), and `ADDITIONAL` (glue IP) sections.
- **Server Role Badging**: Visual tags for `ROOT`, `TLD`, `AUTHORITATIVE`, and `CACHE`.
- **Latency Breakdown**: Per-hop bar chart comparing query durations across all visited nameservers.
- **Preset Quick-Tests**: Instant one-click presets for popular configurations (`google.com`, `cloudflare.com`, `bbc.co.uk`, `github.com`, `fake-host.xyz`).
- **Export Tools**: One-click **COPY JSON** and **COPY SUMMARY** for lab reports and debugging.

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
| **Backend Testing** | pytest, pytest-asyncio, httpx (TestClient) |
| **Frontend UI** | React 19, Vite, Three.js, @react-three/fiber, @react-three/drei |
| **Styling & Assets** | Plain CSS3 (Swiss blueprint design system, CSS Grid/Flexbox), SVG Icons |

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
│   │   ├── transport.py     # Low-level UDP/TCP socket query transport with EDNS0
│   │   ├── validation.py    # RFC domain and record type validation rules
│   │   ├── records.py       # DNS message parser (Answer, Authority, Additional)
│   │   ├── resolver.py      # Core iterative resolution algorithm
│   │   └── tracer.py        # Orchestrates the trace and records diagnostic steps
│   ├── tests/               # 105+ unit and live network integration tests
│   ├── smoke_step3.py       # Standalone CLI resolution tool
│   ├── pytest.ini           # Pytest configuration
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── index.html           # Single-page HTML entry point
│   ├── vite.config.js       # Vite bundler configuration
│   ├── package.json         # Node.js dependencies and build scripts
│   ├── public/              # Static assets (favicons, manifest)
│   └── src/
│       ├── App.jsx          # Main application orchestrator & telemetry polling
│       ├── main.jsx         # React application bootstrap
│       ├── services/api.js  # Backend REST API client
│       ├── constants/       # Root server registry and lookup data
│       ├── components/      # UI components:
│       │   ├── Header.jsx              # Navigation and live health status pill
│       │   ├── SearchBar.jsx           # Domain input, record selector, presets
│       │   ├── DnsOrbitalCanvas.jsx    # 3D orbital Three.js scene
│       │   ├── HeroScene.jsx           # 3D interactive hero canvas
│       │   ├── GlobeScene.jsx          # 3D celestial node globe
│       │   ├── PathGraph.jsx           # Resolution path flowchart
│       │   ├── TraceTimeline.jsx       # Resolution steps timeline
│       │   ├── TraceStep.jsx           # Step card with DNS table accordions
│       │   ├── ResultCard.jsx          # Final answer card & summary
│       │   ├── CacheBanner.jsx         # Cache HIT/MISS comparison banner
│       │   ├── CacheControls.jsx       # Manual cache clear buttons
│       │   ├── InteractiveSimulator.jsx# Step-by-step packet simulator
│       │   ├── ScrollStory.jsx         # Guided interactive DNS story
│       │   ├── TelemetryView.jsx       # Live server telemetry & metrics
│       │   ├── TimeChart.jsx           # Per-query latency bar chart
│       │   ├── HistoryList.jsx         # Recent traces session history
│       │   ├── ProtocolModal.jsx       # RFC protocol inspector modal
│       │   └── ErrorMessage.jsx        # Structured error alert cards
│       └── *.css            # Modular styles (index, trace, cache, states)
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
  "cleared": true,
  "entries_removed": 3
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

## Manual Testing Checklist

1. **Basic Trace**: Trace `google.com` with record type `A`. Verify that the step graph shows `ROOT` → `TLD` → `AUTHORITATIVE`, with a cache **MISS** indicator.
2. **Cache Verification**: Run the exact same query again. Verify that the cache banner reports a cache **HIT** with an **N x faster** latency comparison.
3. **Cache Invalidation**: Click the **CLEAR CACHE** button and re-run. Verify it returns to a cache **MISS**.
4. **Record Types**: Test various record types:
   - `AAAA` (IPv6): `cloudflare.com`
   - `MX` (Mail Exchange): `github.com`
   - `NS` (Name Servers): `bbc.co.uk`
   - `TXT` (Text / Verification): `google.com`
5. **CNAME Aliasing**: Trace `www.github.com` or `www.bbc.co.uk` and verify that CNAME referrals are tracked to their canonical targets.
6. **Error Scenarios**:
   - Non-existent domain: `thisdoesnotexist999888.com` (expect `NXDOMAIN`)
   - Syntax validation: `invalid..domain` (expect `INVALID_DOMAIN`)
7. **3D Visualizer & Simulator**: Toggle the interactive 3D orbital view and packet flow simulator to inspect packet progression.

---

## License

This project is open-source under the [MIT License](LICENSE).