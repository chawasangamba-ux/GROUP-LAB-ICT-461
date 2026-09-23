# ICT461 Web Systems Lab — Course Registration Portal

Mulungushi University · School of Engineering and Technology · Department of Computer Science and IT
*Pair submission.* Partner 1: Philip Sikayuta (202308496). Partner 2: [add name and student number].

A small course registration portal built to the competency-based lab brief: semantic/responsive
interface, Fetch + modules, a six-route HTTP API, caching, cookies and CORS — all demonstrated with
real DevTools evidence, not simulated.

## Run it

Two servers, two terminals.

*Terminal 1 — API (port 3000):*
bash
npm install
npm start         # node server.js


*Terminal 2 — interface (port 5500):*
Open the public/ folder in VS Code and use the *Live Server* extension ("Open with Live Server"
on index.html), which defaults to port 5500 — or run one of:
bash
npx serve public -l 5500
npx http-server public -p 5500


Then open *http://localhost:5500*. The API must already be running on port 3000, or every request
will fail (see the CORS/network section below for what that failure looks like).

## Project structure


ict461-web-systems-lab/
├── server.js              # Express API — all 6 routes + /inspect + cookie demo
├── package.json / package-lock.json
├── public/                 # served on :5500
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js          # fetch helpers ONLY (no DOM code)
│       └── app.js           # DOM + events ONLY (imports api.js)
├── README.md                # this file — run instructions + API contract
├── CHECKPOINT-A.md          # systems sketch + validation placement (pre-AI exercise)
├── AI-use.md                 # required AI-use log
├── DECISION-NOTE.md          # short design rationale
├── evidence/                 # screenshot evidence (see EVIDENCE.md checklist)
└── EVIDENCE.md


## API contract

Base URL: http://localhost:3000. All bodies are JSON unless stated otherwise (/inspect also
accepts form-encoded — see Task 2.3).

| Method | Route | Request body | Success | Failure 1 | Failure 2 | Cache-Control | Notes |
|---|---|---|---|---|---|---|---|
| GET | /api/courses | — | 200 OK | 500 (design-only) | 503 (design-only) | public, max-age=60 | Also returns ETag; send If-None-Match to get 304 with no body |
| GET | /api/registrations/:id | — | 200 OK | 404 Not Found | 500 (design-only) | no-store | Personal data — never cached |
| POST | /api/registrations | {name, studentId, programme, course} | 201 Created + Location header | 400 Bad Request (missing/invalid field) | 409 Conflict (duplicate studentId+course) | no-store | |
| PUT | /api/registrations/:id | {name, studentId, programme, course} (all required) | 200 OK | 400 Bad Request | 404 Not Found (added beyond the brief's minimum — documented here as such) | no-store | Full replace |
| PATCH | /api/registrations/:id | {programme} | 200 OK | 400 Bad Request (invalid programme) | 404 Not Found (added beyond the brief's minimum) | no-store | Programme only |
| DELETE | /api/registrations/:id | — | 204 No Content (no body) | 404 Not Found | 500 (design-only) | no-store | Never res.json() a 204 |
| ALL | /inspect | any | 200 OK (echoes method/path/headers/body) | — | — | — | Diagnostic only, Task 2.3 |
| GET | /api/demo-cookie | — | 200 OK | — | — | — | Sets a non-sensitive HttpOnly; SameSite=Lax; Path=/ cookie |

*"Design-only" failures* (500/503 above) are documented per the brief's instruction to label
failures that this in-memory prototype cannot actually trigger without deliberately breaking it —
they are not wired to real code paths.

### Idempotency note (Task 2.1)

Repeating *PUT* or *DELETE* produces the same end state every time (the record ends up
identical either way) — that is what "idempotent" means here: the *intended server effect*, not
the HTTP status code. A repeated DELETE after the first success returns 404 the second time, not
another 204 — the status code changed, but the effect (the record no longer exists) did not.
Repeating *POST* is deliberately not idempotent: the second identical submission is rejected with
409, which is the duplicate-registration rule the brief asks for.

### Caching — freshness vs revalidation (Task 3.1)

- *Fresh* (max-age=60 not yet elapsed): the browser reuses its cached copy and never contacts the
  server at all — no request is visible in Network for a fresh hit.
- *Revalidation* (max-age elapsed, or a hard reload): the browser does contact the server, but
  sends If-None-Match with the ETag it already has. If the data has not changed, the server returns
  304 Not Modified with no body — cheaper than resending the full course list, but not free.

### localStorage vs sessionStorage (Task 1.3)

Only the *programme preference* is persisted, in localStorage:

- localStorage survives closing the browser and is shared across every tab on this origin — right
  for a preference a student expects to still be set next visit.
- sessionStorage is cleared when the tab closes and is not shared with other tabs — would suit
  something like a one-visit dismissible notice, not used in this lab.

### Cookies (Task 4.1–4.2)

- HttpOnly — the cookie is invisible to document.cookie; only the browser and server can read it,
  which blocks a large class of XSS token-theft attacks.
- SameSite=Lax — blocks the cookie being sent on most cross-site requests (mitigates CSRF) while
  still allowing normal top-level navigation.
- Secure is *not* set here because the demo runs over plain http://localhost; a real deployment
  over HTTPS must add it, or the browser will refuse to store the cookie at all in modern browsers'
  strict configurations.
- SameSite alone is *not* complete CSRF protection — it does not cover subdomains, misconfigured
  SameSite=None, or cases where the state-changing request is still allowed cross-site (e.g. simple
  GET navigations). CSRF tokens remain necessary for a real login system.
- Cookie sessions vs bearer tokens: a cookie is sent automatically by the browser on every matching
  request (convenient, but that's also what makes CSRF possible); a bearer token must be attached
  manually by client code (immune to CSRF by default, but the client must store it somewhere — and
  localStorage is readable by any script, so an XSS bug there is worse than an HttpOnly cookie).

## Evidence

See EVIDENCE.md for the full checklist and screenshot slots (Network captures, cURL reproduction,
CORS failure + success, cookie panel, waterfall before/after, Protocol column)