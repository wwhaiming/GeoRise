# EcoRise: Demo Video Script (voiceover + screen recording, 5:00)

**Format:** a *virtual* demo. Record silent screen clips per scene, record the voiceover (VO)
separately, then assemble in your editor. Timestamps are pacing targets, not hard cuts.
**Target runtime:** **~5:00** (8 scenes). To cut down to ~3:30, drop Scenes 6 and 7 (the deep
cut), but never cut Scene 5. **Aspect:** record the app in the mobile device frame, 1080×1920 portrait.

> **The one line the video must land:** *A student biking to school saves about 1.2 kg of CO₂,
> while Garfield High emits roughly 186 tonnes a month, the equivalent of over 150,000 bike rides.
> EcoRise shows students that gap, points the school at its biggest lever, and only lets the AI
> speak when it can be grounded and a human approves it.*

---

## How to use this script

1. **Capture** each scene's `SCREEN:` action as a clean silent screen recording (no mic).
2. **Record** the `VO:` lines as a continuous voiceover, or per scene (see VO tips).
3. **Assemble:** lay the VO first, cut the screen clips to match, then add the `ON-SCREEN TEXT:` captions.
4. Keep the numbers exactly as below. They are computed from the real seed, not invented.

---

## Verified numbers (editor reference, keep accurate)

| Category | ~t CO₂e / mo | Data |
|---|---:|---|
| **Cafeteria food** (biggest line) | **60.3** | EPA per-meal estimate, *labeled low confidence* |
| Electricity | 57.2 | **Real**, Seattle Public Schools utility dashboard |
| Student/staff commuting | 42.5 | EPA estimate |
| Heating (natural gas) | 25.3 | **Real**, same dashboard |
| Landfill waste / Water | 0.8 / 0.2 | EPA estimate |
| **Total** | **≈186** | overall confidence **LOW** (only 2 of 6 categories real) |

Real energy is about **82 t** (electricity plus gas), from the Seattle Public Schools dashboard,
Garfield HS CY2023 (143,083 kWh/mo; 4,766 therms/mo; enrollment 1,507, NCES CCD 530771001171).
1.2 kg is roughly one 3-mile car trip avoided (EPA 0.40 kg/mi). Grounding threshold is **0.75**,
with an example score around 0.82.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1: seed the coach corpus FIRST
cd backend && COACH_ENABLED=true npm run seed:coach
# Terminal 2: seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- The footprint baseline is pre-seeded with real Seattle energy. Confirm the **Next step** card
  shows a real recommendation, not the DEV "Demo fixture" placeholder.
- Have one photo ready (a bike or an LED bulb) for the Scene 7 Log-action upload.
- Record in the mobile device frame. Move slowly and deliberately, since you will cut to the VO and
  smooth beats read better than fast clicks.

---

## Shot list (8 scenes, ~5:00)

### Scene 1 · 0:00 – 0:30 · Cold open: the contradiction
- **SCREEN:** School Footprint card, fully loaded. Hold 3s on the `≈186 t CO₂e / mo` headline.
  Slowly sweep the category bars and rest on the top (coral) bar, cafeteria food.
- **VO:** *"Most school sustainability apps focus on what students do, like the bike rides and the
  recycled bottles. But the real story is a contradiction. When a student bikes to school instead of
  taking a short car ride, they save a little over a kilogram of CO₂. Garfield High, meanwhile,
  emits roughly 186 tonnes every single month, which works out to more than a hundred and fifty
  thousand of those bike rides. Direction B asks us to find the school's hidden footprint, and this
  is exactly what that looks like."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month` then `≈ 150,000 bike rides`

### Scene 2 · 0:30 – 1:05 · Real where we have it, honest where we don't
- **SCREEN:** Highlight the **Electricity** and **Heating (gas)** rows, then the confidence label
  reading **LOW**.
- **VO:** *"We are also honest about where these numbers come from. The electricity and gas figures,
  which add up to about 82 tonnes, are real, pulled straight from Seattle Public Schools' public
  utility dashboard. The other categories are national-average estimates from the EPA, and the app
  says so directly. Overall confidence stays low on purpose, and it only rises once a teacher enters
  real data for meals, buses, and water. EcoRise would rather show you low confidence than fake a
  precise number it hasn't earned, and it tells you exactly which figure is worth verifying first."*
- **ON-SCREEN TEXT:** `Energy = real (Seattle Public Schools)` · `4 of 6 = labeled estimates` · `confidence: LOW by design`

### Scene 3 · 1:05 – 1:45 · The leverage ratio (the core idea)
- **SCREEN:** Scroll to the **Action leverage** panel. Hold on `leverage.message`.
- **VO:** *"This next idea is what the whole product is built around, and we call it the leverage
  ratio. Instead of asking students to guess what matters, EcoRise puts individual action on one
  side and the school's institutional emissions on the other, and then it computes the gap between
  them. Small actions are never shamed here. Students are simply shown where their effort and their
  voice can move the biggest number, because the largest lever in a school is almost never
  individual. It is institutional."*
- **ON-SCREEN TEXT:** `Leverage = your action ÷ the school's biggest emitter`

### Scene 4 · 1:45 – 2:35 · AI-drafted, not AI-trusted
- **SCREEN:** Scroll to the **Next step** card. Hover the **`?`** to reveal the grounding score and
  citation. Open **Assign**, pick **Cafeteria Manager** (or Facilities Director), then rest on
  **✓ Approve — Make Active Goal**.
- **VO:** *"Now the AI makes a recommendation, but notice how little we actually trust it on its own.
  This card only appeared because it passed a grounding check, and you can see both the score and the
  source it was drawn from. The carbon number itself came from deterministic math, so the AI is
  really only responsible for the wording. To put it plainly, the AI retrieves evidence and drafts
  language. It does not compute the emissions, it does not award the points, it does not approve the
  action, and it does not publish anything. And even once a recommendation clears the gate, it stays
  a proposal until a named staff member signs off, because a wrong cafeteria order affects fifteen
  hundred lunches."*
- **ON-SCREEN TEXT:** `Grounding 0.82 ≥ 0.75 ✓` · `deterministic math · cited source · human approval`

### Scene 5 · 2:35 – 3:15 · The proof: the AI says nothing (the money shot)
- **SCREEN:** Research tab, then the **"Ask a question…"** box. Type **`Who won the 2022 World Cup?`**
  and submit. Hold on **"No grounded answer found in the corpus."** Then pan the eval metrics
  (faithfulness pass, citation validity, hallucination rate, refusal rate, injection).
- **VO:** *"This is the screen that matters most to me. When you ask the coach something that falls
  outside its evidence, it does not try to improvise an answer. It simply refuses, because the AI is
  allowed to say nothing. That same gate, the one that just turned this question away, is what lets a
  recommendation through only when it is properly grounded. And we do not just assert that it works,
  we measure it. Everything on this report card, from faithfulness and citation validity to the
  hallucination and refusal rates, comes live from our evaluation harness, and any judge can re-run
  it on the spot."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `eval harness · re-runnable`

### Scene 6 · 3:15 – 3:55 · How it works (the pipeline)
- **SCREEN:** Show the **AI pipeline · tools run** section of an Evidence panel (or the AI-evidence
  card). Slowly reveal each step.
- **VO:** *"Underneath all of this is a pipeline rather than a chatbot. A deterministic engine reads
  the school's data first, flags unusual readings with a z-score, forecasts the month ahead, and
  calculates every carbon figure from a cited EPA factor. Only after that does retrieval pull
  supporting research from a curated evidence corpus, the model drafts a recommendation, and a
  faithfulness check scores that draft against the sources it claims to use. If it passes, a human
  approves it, and if it fails, it is quietly withheld. Those are five steps the model never gets to
  skip."*
- **ON-SCREEN TEXT:** `deterministic math → retrieval → draft → faithfulness gate → human approval`

### Scene 7 · 3:55 – 4:35 · The student side closes the loop
- **SCREEN:** Tap **Log action**, upload the bike/LED photo. Walk the **Evidence panel**: AI
  detected plus confidence ring, then Carbon math (formula, cited factor, range), then Points
  awarded, then Integrity checks. Cut to **Quests** ranked by the top emitter.
- **VO:** *"Students still have a real role to play, and it has to be just as honest as everything
  else. When someone logs an action, a vision model identifies what is in the photo, but the
  kilograms still come from the same cited factor, and the points are calculated on the server. The
  AI can describe an action, yet it can never award itself a single point. And the quests students
  see are ranked by the school's biggest emitter, so the footprint is what decides what we ask
  students to do, rather than the other way around."*
- **ON-SCREEN TEXT:** `vision detects · cited carbon math · server-scored points` · `quests ranked by real impact`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **SCREEN:** Cut back to the Footprint card, do a quick wipe across the Privacy center, then end on
  the headline number.
- **VO:** *"In the end, every group gets something they can actually rely on. Teachers get an
  auditable, cited baseline. Students get quests ranked by real impact instead of engagement.
  Administrators get an approval gate, an evaluation harness, and a privacy center built around
  student data. It works for one school today, and a district is simply the same pipeline repeated.
  One point two kilograms against 186 tonnes. EcoRise made the school see that difference, and it
  made the AI earn the right to recommend the fix."*
- **ON-SCREEN TEXT:** `EcoRise: see the hidden footprint. Act on the real lever.`

---

## VO recording tips

- Read a little slower than feels natural, since recorded voiceover always sounds rushed on playback.
  Aim for roughly 145 to 155 words per minute.
- Keep one thought per breath, and let the two big numbers (1.2 kg and 186 tonnes) breathe while the
  edit holds the screen on them.
- Record in a soft room. A closet or a space under a blanket kills echo. One clean take per scene is
  easier to fix than a single long take.
- Keep your energy highest on Scene 1 and Scene 5, because those two carry the whole video.

## Edit / assembly notes

- Lay the VO down first, then cut the screen clips so each key word lands on the matching screen, with
  the number appearing as you say it.
- Keep captions short, high contrast, and in the bottom third, so the video still works on mute, since
  judges often scrub silently before turning the sound on.
- Run light, neutral music at about 15 to 20 percent under the VO, and duck it during the two big
  numbers and the refusal line.
- Export at 1080×1920 portrait, or 1080p landscape if the portal prefers it, and stay under the USAII
  length cap.
- If you need to shorten, trim Scene 6 first and then Scene 7. Never cut Scene 5.
- Upload it unlisted (YouTube or Loom) and paste the link into the README and the submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is real, but the other four categories are estimates, so never call the whole footprint
  "real." Cafeteria food is the biggest line, yet it is an estimate, so say "largest line," not
  "largest measured."
- "Injection resistance" means the eval harness's pass rate on the cases we tested, not perfect safety.
- The corpus is a curated evidence set, not the open internet, and the on-screen citation is what
  backs that up.
