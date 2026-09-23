# AI-use Log

Per the brief: AI may explain concepts or suggest a fix after a first attempt is made and
recorded. Log every real use below. Do not invent test results — run the test, then record what
actually happened.

## Entry 1

- *Prompt (summary):* Asked Claude to build the full lab — server.js (6 routes + /inspect +
  cookie demo + ETag caching + CORS), the client interface (semantic HTML, responsive CSS,
  api.js/app.js module split), and the supporting docs (README, this file, decision note,
  checkpoint reference, evidence checklist).
- *Suggestion used or rejected:* Used, as the starting implementation for the whole repo.
- *Our test:* Ran node --check on all three JS files, then exercised every route with curl
  (200/201/204/400/404/409 paths, the If-None-Match → 304 path, /inspect with a form-encoded
  body, and the cookie demo) before accepting the code. Full curl transcript is in evidence/.
- *What we learned:* Confirmed the difference between a request that is fresh (never reaches
  the server) and one that is revalidated (reaches the server, gets 304) by watching the ETag
  stay identical across both GETs, and saw first-hand why DELETE must call res.end() and never
  res.json() on a 204.

## Entry 2 — (add your own)

- *Prompt:*
- *Suggestion used or rejected:*
- *Our test:*
- *What we learned:*

## Entry 3 — (add your own, e.g. the CORS failure/fix experiment)

- *Prompt:*
- *Suggestion used or rejected:*
- *Our test:*
- *What we learned:*

---

*Reminder:* every screenshot in evidence/ must come from your own browser session. The AI
cannot see your DevTools, so it cannot generate or verify that evidence for you — that part is
yours to do and is what Checkpoint B's "predicted vs actual" record is for