# 🌱 EcoRise — AI-Powered Environmental Leaderboard

> Your choices. Your impact. Your rank. **Kahoot, if it cared about the planet.**

EcoRise turns real-world climate action into a competitive game. Snap a photo of an
eco-friendly action (biking, a reusable bottle, a plant-based meal, a litter cleanup),
and AI verifies it, estimates the CO₂ saved, and awards points. Players climb animated,
resettable leaderboards for their school or community.

This repository contains the full product: a production-minded full-stack app, a
**locally-trained computer-vision model**, and the original design prototype.

---

## 📁 Repository layout

```
GeoRise/
├── ecorise/                 # The application (the thing you run)
│   ├── backend/             # Node + Express + SQLite API
│   │   ├── routes/          # auth · leaderboard · posts · quests · trashspotter · users
│   │   ├── middleware/      # JWT auth · CSRF · rate limiting · uploads
│   │   ├── utils/           # rubric · pointsEngine (ledger) · aiClient · seasons · validate
│   │   ├── model/           # exported ONNX trash detector (served in-process)
│   │   ├── db.js            # schema, indexes, FKs, migrations
│   │   ├── server.js        # app entry
│   │   └── test/            # 20-test integration suite (node:test + supertest)
│   └── frontend/            # React + Vite single-page app (mobile-first)
├── datasets/                # ML: trains the offline trash detector
│   ├── train_trash_detector.py / export_onnx.py / eval_trash_detector.py
│   ├── trash_detector.onnx / .json    # trained model + metadata
│   └── README.md            # data sources, reproduction, honest limits
└── Design/                  # original Claude-designed UI prototype (handoff bundle)
```

---

## 🛠 Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19 + Vite, mobile-first, state-driven routing |
| Backend | Node.js + Express 4 |
| Database | SQLite (`better-sqlite3`), WAL, foreign keys on |
| Auth | JWT in an **httpOnly cookie** + bcrypt, double-submit **CSRF** |
| Eco-action AI | Anthropic Claude (`claude-sonnet-4-6`) vision, gated + provenance-tagged |
| Trash AI | **Custom CNN trained in this repo** → ONNX, run in-process via `onnxruntime-node` |
| Validation | Zod schemas on every route |
| Tests | `node:test` + `supertest` (20 integration tests) |

---

## ✨ Features

- **AI Evidence Panel** — after **every** submission you see the model's verdict: what it detected, its confidence, the CO₂ math, the full point breakdown, and every anti-fraud gate the action cleared (or exactly why it was rejected). The AI's reasoning is the centerpiece of the UX, not a black box.
- **AI action analysis** — photo → Claude detects the action + estimates CO₂.
- **Trash Spotter** — photo → a trained CNN verifies it's real litter and scores severity 0–10.
- **Rubric points engine** — 5 categories, three scoring shapes, CO₂ bonus, streak/first-action multipliers.
- **Leaderboards** — animated 3-D podium, live reset countdown, season archives, prizes, invite links.
- **Daily quests** — 5 AI-generated quests/day with a 2× multiplier, completed only by *verified* actions.
- **Social feed** — posts, likes, comments, @mentions, reporting + organizer moderation.
- **Badges, streaks, notifications.**

---

## 🔒 Security & integrity (the hard part of a "points = money" app)

EcoRise treats points as currency, so minting them is locked down. Highlights:

- **Sessions:** secret-enforced JWT (refuses weak/default), token only in an httpOnly cookie (never the body or `localStorage`), CSRF required on every cookie-authenticated mutation.
- **Authorization:** board feeds/posts/comments/likes/reports are **membership-gated**; the global feed never leaks private-board posts; moderation is owner/organizer-only; member emails are never exposed.
- **Anti-fraud points:** every award is wrapped in a DB **transaction** and written to an **immutable `point_events` ledger** that is **idempotent per source** (replays can't double-credit). Tagging notifies friends but mints them **zero** points. Duplicate photos are rejected by content hash.
- **Anti-cheat quests:** the quest-progress endpoint never mints points — the 2× bonus is granted only by logging an AI-verified action.
- **Honest AI:** eco and trash analysis both **gate** ("is this actually an eco action / litter?") with confidence + provenance (model + prompt version); with no API key the server **rejects rather than fabricates** points.
- **Hardened data model:** foreign keys with privacy-preserving cascades, unique `(user_id, badge_type)`, unique season, unique ledger source, indexes throughout.
- **Ops:** per-route Zod validation, clamped pagination, auth brute-force limiter, `trust proxy`, scheduled leaderboard resets.

A 20-test integration suite proves the above (authz matrix, invite-code enforcement, ledger==points, ledger idempotency, dup-replay, no-key rejection, anti-cheat quests, private-feed isolation, season reset).

---

## 🤖 The trash detector (trained here)

`datasets/` trains a compact CNN from scratch (no external pretrained weights) to
classify **trash vs not-trash**, then exports to ONNX for in-process inference:

- **Data:** 3,527 images — 2,527 trashnet (litter) + 1,000 ImageNet samples (negatives).
- **Held-out eval:** precision **0.970**, recall **0.931**, false-positive rate **0.072** @ threshold 0.6.
- Runs fully offline; severity is confidence-derived (see `datasets/README.md` for honest limits — it is a strong demo detector, not a calibrated street-litter severity model).

Eco-action analysis uses Claude vision (needs `ANTHROPIC_API_KEY`); without a key the app
runs in a clearly-flagged demo mode (`MOCK_ECO_ALWAYS_PASS`).

---

## 🚀 Run it

```bash
cd ecorise
npm run install:all          # installs root, backend, frontend

cp .env.example .env         # then set a strong JWT_SECRET (required):
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#   optional: ANTHROPIC_API_KEY=...   (eco analysis; trash model works offline)

npm run dev                  # backend :3001 + frontend :5173
npm run demo                 # one-command judge demo: seeds a populated board
                             #   + login (demo@ecorise.app / demo1234), then runs
```

### Tests

```bash
cd ecorise/backend && npm test     # 20 passing integration tests
```

### Retrain the trash model (optional)

```bash
cd datasets
python3.11 -m venv .venv && ./.venv/bin/pip install torch torchvision onnx pillow
./.venv/bin/python train_trash_detector.py --data trash_detector --epochs 12
./.venv/bin/python eval_trash_detector.py
```

---

## ⚠️ Honest limitations

- Trash data is studio recyclables + generic negatives, not curated street litter; the
  model reliably rejects non-litter but is not a calibrated severity grader.
- AI rate limiting is in-memory (use Redis in production); `trust proxy=1` assumes a
  trusted reverse proxy.
- Google OAuth and object storage for images are out of scope for the offline build.

---

*Built as a USAII-style AI hackathon project: a real product, a real trained model, and
production-grade security — not a demo with a happy path.*
