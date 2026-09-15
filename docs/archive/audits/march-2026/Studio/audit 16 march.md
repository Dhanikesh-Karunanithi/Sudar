# Sudar Studio — Full Product Audit & Recommendations

Here's a comprehensive audit of every section I explored in the Studio. Each finding is actionable and Cursor-ready.

---

## 🗂️ 1. COURSES (`/courses`)

### List View

- **No delete course action**  — There's no way to delete a course from the list or from within the editor. Even a "move to trash" or archive option is missing. [sudar-studio.vercel](https://sudar-studio.vercel.app/courses)
- **No multi-select / bulk actions** — You can't select multiple courses to delete, duplicate, disable/archive, or assign to a learning path at once.
- **No search or filter bar** — With 22+ courses, there's no way to filter by status (Published/Draft), difficulty level, date range, or keyword.
- **No sort controls** — Courses appear to be sorted by date descending but there's no UI to re-sort by name, status, or completion rate.
- **No list view toggle** — Only a grid view exists; a compact list/table view would help at scale.
- **Duplicate course names** — "Somehow I manage" and "Introduction to Statistics for Dummies" appear multiple times. No deduplication warning is shown.
- **No course thumbnail/cover image** — Cards show a generic book icon. Custom thumbnails would help creators identify courses visually.
- **No tag/category system** — You can't group or label courses by topic, department, or audience.

### Course Editor

- **No course-level delete button** — Even inside the editor, there's no way to delete the course. You can only Unpublish it.
- **No rename protection** — No warning if two courses have the same name.
- **Completion rule is per-module only** — There's no course-level completion rule (e.g., "learner must pass all quizzes").
- **No version history / undo** — Changes save automatically with no version history or undo trail.
- **No "preview as learner" mode per module** — The Preview button likely previews the full course, but there's no per-module preview.
- **Duration field is a text input ("e.g. 30")**  — This is fragile. It should be a number input with validation, or auto-calculated from modules. [sudar-studio.vercel](https://sudar-studio.vercel.app/courses/6dffa5b0-6917-4974-9943-9642bc14e576)
- **Quiz blocks show placeholder text, not count** — "Quiz block — use 'Generate quiz' below to add questions" is confusing; if a quiz exists, it should show the question count.
- **No block-level duplicate** — Blocks can be deleted or reordered but not duplicated.
- **AI Prompt Ideas in sidebar are static** — These are hardcoded suggestions with no way to generate new ones or customise them per course topic.
- **"Video & Podcast" — no audio generation yet** — Scenes/segments show "no audio yet" but there's no clear CTA or button within the editor to generate/trigger audio directly.
- **No cover image uploader on the course overview** — Only text-based fields are available at course level.

---

## 🛤️ 2. LEARNING PATHS (`/paths`)

- `**/learning-paths` route returns 404**  — Linking to this URL (e.g., from docs or email) will break. The actual route is `/paths`. Either redirect should be set up or the route should be consistent with the sidebar label. [sudar-studio.vercel](https://sudar-studio.vercel.app/learning-paths)
- **No delete path action** — From the list view, there's no option to delete or archive a path.
- **No edit path name from list view** — Can only enter the path to edit it.
- **No multi-select / bulk actions** on the paths list.
- **No search or filter** on the paths list.
- **"Optional" vs "Mandatory" toggle per course** — There's a lock icon button per course, but the toggle UI isn't immediately obvious. A clearer label or toggle switch would improve discoverability.
- **No due date per learning path from the list view** — Due dates are only visible in Compliance, not in the path editor.
- **Assigned Learners section lacks actions** — You can see who's assigned but can't unassign, message, or view their detailed progress from within the path editor.
- **No certificate preview** — Certificate is togglable but there's no way to preview or customise the certificate design from the Studio.

---

## 📊 3. ANALYTICS (`/analytics`)

- **No date range filter** — All metrics appear to be all-time with no ability to filter by week, month, quarter, or custom range.
- **No export to CSV/PDF** — Admins typically need to export data for reporting. No export button exists.
- **Course performance table shows truncated names** — "Introduction to..." appears multiple times with no way to distinguish them in the table.
- **Learner Profiles section is card-only** — With many learners, this won't scale. A table view with sorting/filtering would be needed.
- **"Time per section" dropdown** — Requires selecting a course first; defaults to "Select a course" with no pre-populated data. Consider showing an aggregate overview by default.
- **"Sudar interactions" metric (35)** — No drilldown or explanation of what this means. A tooltip or click-to-expand detail would help.
- **No comparison / trend charts** — All KPIs are single numbers with no graphs showing progress over time.
- **Top Org-Wide Struggles tags** — These are shown but clicking them does nothing. They should ideally link to courses or modules that address those concepts.

---

## 🛡️ 4. COMPLIANCE (`/compliance`)

- **Very minimal page**  — Only shows a flat table with Learner / Path / Due Date / Progress / Status. No filtering, searching, or export. [sudar-studio.vercel](https://sudar-studio.vercel.app/compliance)
- **No way to set due dates from this page** — "Manage paths" link goes elsewhere. Due dates should be editable inline or at least quickly accessible.
- **No bulk reminder / notification system** — Can't send reminders to overdue learners from this page.
- **No group-level compliance view** — No way to see compliance by team/department/group.
- **"Overdue" and "At Risk" badges show 0** — These are hardcoded-looking counters; no drilldown on what these thresholds represent or how to configure them.

---

## 👥 5. USERS (`/users`)

- **Only 1 user, but no "empty state" for adding more**  — The page shows a checkbox column with no select-all or bulk actions even now. [sudar-studio.vercel](https://sudar-studio.vercel.app/users)
- **No search/filter on users list** — At scale, filtering by role, status, or name will be essential.
- **No bulk invite / remove** — Invite is single-email only (no CSV multi-invite from the list view, only Bulk Import as a separate flow).
- **No role management UI** — Role shows "ADMIN" but there's no dropdown to change roles from the list view.
- **User detail page has raw form UX for Performance Data**  — KPI, Key, Value, Display, Date fields are all unstyled native inputs in a row. This needs a cleaner form design. [sudar-studio.vercel](https://sudar-studio.vercel.app/users/bb8e0b1d-0048-4c2d-bc82-bba7948c1bc8)
- **No delete user option** — Only "Disable access" and "Reset password (OTP)" are available. There's no way to permanently delete/remove a user.
- **No user activity log** — No way to see what a user has done in the system (last login, courses viewed, etc.) from the admin side.
- **"Assign to path" inside user detail uses a dropdown select** — At scale with many paths, this will be hard to use. A searchable combobox would be better.

---

## 🔌 6. INTEGRATIONS (`/integrations`)

- **Provisioning checklist steps are not checkable**  — The 5-step checklist (Identity, Directory, LMS/LTI, AI Keys, Data) is purely informational. It should track which steps are completed with visual checkmarks. [sudar-studio.vercel](https://sudar-studio.vercel.app/integrations)
- **No status indicator per integration** — You can't tell at a glance if SSO, LTI, or Directory sync is connected/working without navigating away.
- **Visual guide is not collapsible by default** — The "How integrations work" section takes up a lot of vertical space and could default to collapsed.

---

## 🔑 7. AI & API KEYS (`/settings/keys`)

- **No "test connection" button** per key — After entering a key, there's no way to verify it's working from the UI.
- **Configured status is shown but not live-tested** — Keys show "Configured" but this may just mean the env var exists, not that it's valid.
- **No grouping of optional vs. required keys** — Required keys are separated, but optional ones could be better grouped by feature (e.g., "Media", "TTS", "Chat").

---

## ⚙️ 8. ORG SETTINGS (`/settings`)

- **No org name / logo / branding settings**  — There's no field to set the organisation's display name, logo, or custom domain for the learner-facing Sudar Learn interface. [sudar-studio.vercel](https://sudar-studio.vercel.app/settings)
- **TTS voice selection has no audio preview button** — 6 voices are shown but you can't click to hear a sample before selecting.
- **"Content generation" model selection** — "Default / Complex / Faster" labels are vague; a tooltip with model name (e.g., GPT-4o, Claude 3.5 Sonnet) would be more transparent.
- **Save button is top-right only** — After scrolling through a long settings page, there's no sticky Save button or footer Save CTA.

---

## 🧭 9. DASHBOARD (`/`)

- **"Recent courses" is the only widget**  — Dashboard has 4 stat tiles but no charts, no quick actions beyond "New course", and no recent activity feed. [sudar-studio.vercel](https://sudar-studio.vercel.app/)
- **Stats are not clickable** — "22 Total courses", "17 Learners", etc. don't link to their respective sections.
- **No "draft courses" alert or call-to-action** — 6 courses are in Draft status; the dashboard could surface "X courses not yet published" to nudge completion.
- **No announcements or notification area** — No way to see system events, recent completions, or alerts.
- **Greeting says "Good evening" at 1 AM** — The time-of-day greeting logic may not be accounting for IST timezone correctly.

---

## 🆕 10. COURSE CREATION FLOW (`/courses/new`)

- **No template picker**  — Even though the login screen advertises "14 course templates", there's no template selection in the new course flow. [sudar-studio.vercel](https://sudar-studio.vercel.app/courses/new)
- **"Number of modules" is a fixed set of options (3/5/7/10)** — No free-entry option for creators who want exactly 4, 6, 8, or 12 modules.
- **No audience/persona field** — Who is this course for? Adding a "Target audience" field would help the AI generate better-targeted content.
- **No language selection** — Content is assumed to be in English with no option to generate in another language.
- **"Import from document" has no file size/type preview** — After uploading a PDF/DOCX, there's no confirmation of what was detected before generating.

---

## 🎨 11. GLOBAL UX ISSUES

- **No keyboard shortcuts** — Power users managing 22+ courses would benefit from keyboard shortcuts (e.g., `N` for new course, `S` to save, `P` to publish/unpublish).
- **No breadcrumb navigation** — Inside course or path editor, there's no breadcrumb trail. The only navigation back is the "← Back to courses" link.
- **No onboarding/empty states for new orgs** — When an org has no courses or users, the pages are just blank. Guided empty states with CTAs would improve activation.
- **Sidebar shows "Help & Guides" but links to `/help` which is dev-oriented** — Help content is mostly about env vars and API keys, not about how to use Studio features as a content creator.
- **No dark/light mode toggle** — The app is dark-mode only with no option.
- **No notification system** — No bell icon, no toast notifications for background jobs (e.g., AI course generation completing).
- **No audit log for admins** — No way to see who created, edited, or published which content, and when.

---

## Summary Table for Cursor


| Area            | Priority  | Feature to Build                             |
| --------------- | --------- | -------------------------------------------- |
| Courses List    | 🔴 High   | Delete, multi-select, bulk actions           |
| Courses List    | 🔴 High   | Search, filter, sort                         |
| Course Editor   | 🔴 High   | Delete course button                         |
| Course Editor   | 🟡 Medium | Version history / undo                       |
| Course Editor   | 🟡 Medium | Block-level duplicate                        |
| Learning Paths  | 🔴 High   | Delete path action                           |
| Learning Paths  | 🟡 Medium | Fix `/learning-paths` 404 with redirect      |
| Learning Paths  | 🟡 Medium | Certificate preview/customisation            |
| Analytics       | 🔴 High   | Date range filter                            |
| Analytics       | 🟡 Medium | CSV export                                   |
| Analytics       | 🟡 Medium | Trend charts over time                       |
| Compliance      | 🟡 Medium | Inline due date editing, bulk reminders      |
| Users           | 🔴 High   | Search/filter, role change from list         |
| Users           | 🟡 Medium | Delete user, activity log                    |
| Dashboard       | 🟡 Medium | Clickable stat tiles, draft course alerts    |
| Course Creation | 🟡 Medium | Template picker, language selection          |
| Global          | 🔴 High   | Notification system for async jobs           |
| Global          | 🟡 Medium | Keyboard shortcuts, breadcrumbs              |
| Org Settings    | 🟡 Medium | Org branding (logo, name), TTS audio preview |


