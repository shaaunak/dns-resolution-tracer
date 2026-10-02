# DNS Resolution Tracer & Visualizer

A Computer Networks course project that shows how a domain name is **really** resolved, step by step. Type a domain such as `google.com`, pick a record type, and the app performs a real iterative DNS resolution (Root → TLD → Authoritative). For every query it shows which DNS server was asked, the record type, the response, how long it took, and the final IP address. It also tells you whether the answer came from **this application's own cache**.

> The cache shown in this app is the application's own in-memory cache. The app never claims anything about the caches of remote DNS servers.

## Live demo

**https://dns-tracer.onrender.com**

The demo runs on Render's free plan, so please keep these points in mind:

- If nobody has used it for about 15 minutes, the backend goes to sleep. The first load after that can take up to a minute.
- The application cache lives on the backend and is shared by all visitors, so a cache HIT can come from someone else's earlier trace. The cache also resets whenever the backend sleeps or restarts.

## Features

- **Real iterative resolver** written in Python: starts at the IANA root servers, follows referrals through TLD to authoritative servers, uses glue records, resolves nameserver names itself when there is no glue, follows CNAME chains (with loop and depth protection), uses UDP with TCP fallback, and supports EDNS0.
- **Application cache** that respects TTL (key = domain + record type). It resets when the backend restarts.
- **Structured error codes**: `INVALID_DOMAIN`, `INVALID_RECORD_TYPE`, `NXDOMAIN`, `NODATA`, `SERVFAIL`, `REFUSED`, `TIMEOUT`, `NETWORK_ERROR`, `PARSE_ERROR`, `CNAME_LOOP`, `MAX_DEPTH_EXCEEDED`, `NO_NAMESERVERS`, `INTERNAL_ERROR`.
- **Search bar** with a record type dropdown: A, AAAA, CNAME, NS, MX, TXT.
- **Animated resolution path graph** built from the real steps returned by the backend. It handles any number of steps, timed-out servers, cache hits, rejected input, and NODATA/NXDOMAIN end states, and stacks vertically on phones.
- **Step cards** showing the query, record type, RCODE, authoritative flag, TTL, transport (UDP/TCP), application cache status, and expandable Answer / Authority / Additional (glue) tables.
- **Result card** with a cache HIT/MISS banner, total time, number of DNS queries sent, average query time, TTL, and the final answer table. A cache hit shows "N x faster" compared with the earlier real trace in the same browser session.
- **Extras**: CLEAR CACHE button, per-query time bar chart, COPY JSON, COPY SUMMARY, EXPAND ALL / COLLAPSE ALL, CLEAR TRACE, recent traces history (click to re-run), loading state, friendly error messages (no stack traces), a "backend online/offline" status pill, responsive phone layout, page title and favicon.

## Tech stack

| Part | Technology |
|------|------------|
| Backend | Python 3.14, FastAPI, uvicorn, dnspython, pydantic |
| Backend tests | pytest, httpx (via FastAPI's TestClient) |
| Frontend | React (JavaScript) built with Vite, plain CSS |

## Project structure

```
dns-resolution-tracer/
├── backend/
│   ├── main.py              # FastAPI app and API routes, CORS
│   ├── models.py            # Data models and error codes
│   ├── cache.py             # TTL-aware in-memory application cache
│   ├── engine/
│   │   ├── roots.py         # IANA root server hints
│   │   ├── transport.py     # UDP query with TCP fallback, EDNS0
│   │   ├── validation.py    # Domain and record type validation
│   │   ├── records.py       # Parsing and classifying DNS responses
│   │   ├── resolver.py      # Iterative resolution logic
│   │   └── tracer.py        # Builds the trace returned by the API
│   ├── tests/               # Offline unit tests and live network tests
│   ├── smoke_step3.py       # Command-line demo of a real trace
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── .env.example         # Optional backend address setting
│   ├── package.json
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── services/api.js  # All communication with the backend
│       ├── components/      # Header, SearchBar, PathGraph, TraceTimeline, ...
│       └── *.css            # index, trace, cache and states styles
└── README.md
```

## How the DNS resolution works (short version)

1. The resolver asks a **root server** where to find the servers for the top-level domain (for example `.com`). The root answers with a **referral**: a list of TLD name servers (often with their IP addresses, called *glue records*).
2. It asks a **TLD server** for the domain. The TLD server answers with another referral to the domain's **authoritative** name servers.
3. It asks an **authoritative server**, which gives the final answer (for example the IP address).
4. If the answer is a **CNAME** (an alias), the resolver follows it to the real name. If a referral has no glue, the resolver first looks up the name server's address itself.
5. Every query is timed and recorded as one step. Before doing any of this, the app checks its **own cache**. If the answer is still valid (TTL not expired), it returns it without sending any DNS queries.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Checks that the backend is running |
| POST | `/api/trace` | Resolves a domain and returns the trace |
| POST | `/api/cache/clear` | Clears the application cache |

Example request for `/api/trace`:

```json
{ "domain": "google.com", "record_type": "A" }
```

Interactive API docs (Swagger) are available at http://127.0.0.1:8000/docs while the backend is running. CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`.

## Getting started

You need **Python 3.14** (the version this project was built and tested with), **Node.js with npm** (a current LTS version is recommended), and **Git**. The backend needs internet access with outgoing DNS traffic allowed (port 53). Some college or office networks block this, which would make traces time out.

### 1. Clone the project

```bash
git clone https://github.com/shaaunak/dns-resolution-tracer.git
cd dns-resolution-tracer
```

### 2. Start the backend (Terminal tab 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On Windows, activate the environment with `.venv\Scripts\activate` instead of the `source` line.

Check it works: open http://127.0.0.1:8000/api/health in your browser.

### 3. Start the frontend (Terminal tab 2)

Open a **new** terminal tab (the first one is busy running the server):

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

The frontend talks to `http://127.0.0.1:8000` by default. To use a different backend address, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`.

## Running the tests

Run these from the `backend` folder with the virtual environment active.

```bash
# Offline tests (default). No network needed.
python -m pytest

# Live tests. These send real DNS queries over the network.
python -m pytest -m live
```

Live tests are excluded by default because they depend on the network. The offline suite had **105 passing tests** when this README was written; the project also has 11 live tests.

You can also run a real trace from the command line:

```bash
python smoke_step3.py google.com A
```

## How to test the whole app manually

1. Start the backend and the frontend as described above. The status pill in the header should say the backend is online.
2. Trace `google.com` with record type `A`. You should see the Root → TLD → Authoritative path, the step cards, and a cache **MISS**.
3. Trace `google.com` `A` again. You should see a cache **HIT** and an "N x faster" line.
4. Press **CLEAR CACHE** and trace again. It should be a MISS again.
5. Try other record types (AAAA, NS, MX, TXT, CNAME).
6. Try an invalid domain (for example `not a domain`) and a domain that does not exist (for example `thisdoesnotexist12345.com`) to see the friendly error messages.
7. Stop the backend and check that the status pill changes to offline.
8. Make the browser window narrow to check the phone layout.

## Known limitations

- The loading state does not show live per-server progress. One HTTP request cannot report that, so the real steps appear when the response arrives.
- The application cache and the recent-traces history are in memory only. The cache is lost when the backend restarts, and the history is lost when the page is refreshed. The cache is this application's cache, not a DNS server's cache.
- The "N x faster" line only compares traces within the current browser session.
- Server type labels (ROOT / TLD / AUTHORITATIVE) are a simplification based on the zone name.
- A server that times out adds about 3 seconds per attempt. This is real network behaviour.
- TCP fallback is covered by unit tests, but it has not been observed in a live run.
- The record type dropdown is the browser's native `<select>`.