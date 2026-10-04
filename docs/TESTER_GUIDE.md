# Sudar beta — tester guide

Thanks for testing Sudar. This guide covers what is in scope, what is known to be rough, how to report problems, and a short script for each feature. It takes about 45 minutes to run every script once.

- **Studio** (authoring, admins): https://studio.thesudar.com
- **Learn** (learners): https://learn.thesudar.com
- **Your org:** you will be invited by email into the **Sudar Beta** org. Accept the invite with the same email; you land in the right org automatically. If you see "Invite required", the invite email was not used — ask for a new invite rather than signing up separately.

## 1. How to report a problem

1. **In the app (preferred):** in Studio, click **Feedback** (bottom-right, next to the Sudar chat button). In Learn, open Sudar (the tutor) and type *report a bug* or pick **Share early access feedback**. The form captures the page you are on.
2. Pick a category (bug, UX, idea, other), describe **what you did, what you expected, what happened**, and paste a screenshot with Ctrl+V.
3. If the app is too broken to open the form, email the team with the page URL, time (with time zone) and a screenshot.

Please do not paste passwords, personal data about real people, or confidential company material into the tutor, feedback, or course content.

## 2. What is in scope

| Area | Surface | In beta |
|---|---|---|
| AI course generation with quality review | Studio → Courses | Yes |
| Manual authoring, publishing, review flags | Studio → Course editor | Yes |
| Domains (Teaching OS claims) | Studio → Domains | Yes |
| SudarSim scenario authoring + preview | Studio → SudarSim | Yes |
| Course learning: Read, Listen, Watch, Map, Cards | Learn → course viewer | Yes |
| Sudar tutor (in course and floating) | Learn | Yes |
| "What you'll master" + Next 15 minutes | Learn → course viewer, dashboard | Yes |
| SudarNotes (conversational notebook, voice) | Learn → `/journey` | Yes |
| Practice (SudarSim roleplay, text / push-to-talk / live voice) | Learn → Practice | Yes |
| MCP (ChatGPT / Cursor course building) | `mcp.thesudar.com` | Invited power users only |
| SudarFeed, SudarPlay games | — | Not in beta (hidden) |

## 3. Known issues (please don't report these)

- **Live voice in Practice** needs the voice service to be up. If it can't connect within about 15 seconds, Sudar switches to push-to-talk and says so; you can always type instead.
- **SudarNotes sync is last-write-wins.** Two tabs open on SudarNotes can overwrite each other's notebook.
- **Mastery ("What you'll master", Next 15)** only appears for modules linked to a Domain's claims. Courses without a Domain show no mastery strip; that is expected.
- **Fact-checking is citation-level.** Generated modules must cite real sources, but individual claims are not verified against the source text. Report anything factually wrong as a bug.
- **Learn-side AI extras** (flashcards, mind maps, personalised audio) are moderated but not yet scored by the full quality rubric used for authored modules.
- **Two tutor panels:** the course viewer has its own docked tutor; the floating Sudar chat is hidden on course pages so you never see both at once.

## 4. Test scripts

Each script lists the steps and what "good" looks like. Report anything that doesn't match.

### A. Author and publish a course (Studio, 10 min)
1. Courses → New course → generate from a topic you know well (e.g. "Handling an angry customer call", 3 modules).
2. Open each module. **Good:** clear objectives, examples, a short quiz; no broken formatting; citations point to real pages.
3. Open the course's **Quality** review page (`/courses/<id>/quality`). Modules marked **Needs review** list their issues; fix or regenerate the module, then resolve each issue or approve the module.
4. Publish. **Good:** publish succeeds, or it tells you exactly which modules still have critical issues.

### B. Learn a course (Learn, 10 min)
1. Open the published course from Courses (you can only see courses in your org).
2. Switch between Read, Listen, Watch, Map and Cards on one module. **Good:** each loads within a few seconds and matches the module.
3. Take the module quiz. **Good:** feedback on wrong answers; "What you'll master" updates if the module has claims.
4. Ask Sudar two questions about the module and one off-topic question. **Good:** short, friendly, grounded answers; off-topic requests are gently redirected.

### C. Next 15 minutes (Learn dashboard, 3 min)
1. After finishing a module, go to the dashboard. **Good:** the Next 15 card suggests a review or next step; "Review with Sudar" opens the tutor on that topic.

### D. SudarNotes (Learn → `/journey`, 10 min)
1. Pick a Domain (if offered) and tell Sudar what you want to learn.
2. Answer a few questions; ask Sudar to save a note. **Good:** the notebook grows with clean, useful notes.
3. Turn on voice (speaker icon), hold **Talk**, speak a question. **Good:** your speech is transcribed and Sudar reads its reply aloud.
4. Reload the page, then open SudarNotes on another device. **Good:** the notebook is still there.

### E. Practice with SudarSim (Learn → Practice, 10 min)
1. Pick a scenario and start. Try live voice first; if it falls back, use push-to-talk or type.
2. Hold a 5–8 turn conversation, then finish. **Good:** the persona stays in character and reacts to what you say; the coach report gives specific, fair feedback.

### F. Studio feedback loop (2 min)
1. Click **Feedback** in Studio, attach a screenshot, submit. **Good:** a thank-you confirmation appears.

## 5. Privacy during the beta

Beta data lives in a separate Sudar Beta org and may be wiped at the end of the beta. AI providers process prompts to answer them; see [trust/SUBPROCESSORS.md](trust/SUBPROCESSORS.md). Error reports sent to our monitoring never include your messages or course content.

---

## For the team: running the automated smoke test

`e2e/` holds Playwright tests. Public and security checks need no credentials:

```bash
cd e2e && npm install && npx playwright install chromium
E2E_STUDIO_URL=https://staging.studio.thesudar.com E2E_LEARN_URL=https://staging.learn.thesudar.com npm run test:public
```

The full loop (author → publish → enroll → learn → events → mastery → Next 15, plus optional tutor and Sim) runs with a creator and a learner account **in the same org**: set `E2E_CREATOR_EMAIL/PASSWORD`, `E2E_LEARNER_EMAIL/PASSWORD`, optionally `E2E_RUN_AI=1` and `E2E_SIM_SCENARIO_ID`, then `npm test`. It creates and deletes one throwaway course. CI: **E2E smoke** workflow (manual + daily).

Onboarding testers: switch Studio to **Sudar Beta**, then Users → invite by email. See decision D-020 in [memory/DECISIONS.md](memory/DECISIONS.md).
