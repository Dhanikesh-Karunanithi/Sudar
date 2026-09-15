# Sudar Learn — Full Application Audit & Recommendations

Here is a comprehensive audit across every page and feature I explored. Findings are grouped by category so you can paste this directly into Cursor.

***

## 🐛 BUGS & BROKEN FUNCTIONALITY

### 1. `"More"` Dropdown is invisible / clipped
**Page:** All pages (top nav) [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** Clicking "More" activates the button (turns purple) but the dropdown renders off-screen or behind the viewport right edge. Items like "Goals" and "Certifications" are inaccessible via the UI.
**Fix:** Add `right: 0` or `left: auto` to the dropdown menu positioning, and ensure it uses `position: fixed` or is anchored to not overflow the viewport edge.

### 2. `/goals` — 404 Page Not Found
**Page:** Linked from the "More" dropdown [sudar-learn.vercel](https://sudar-learn.vercel.app/goals)
**Issue:** The Goals link inside the More menu leads to a raw Next.js 404 with a completely black screen — no branded error page, no navigation.
**Fix:** Either build the `/goals` route, or remove the link until it's ready. Also add a custom branded 404 page with navigation links.

### 3. `/register` — 404 Page Not Found
**Page:** Login page "Create one" link [sudar-learn.vercel](https://sudar-learn.vercel.app/register)
**Issue:** The "Don't have an account? Create one" link on the login page leads to `/register` which is a 404.
**Fix:** Either add a `/register` route or redirect to the correct signup flow.

### 4. Custom 404 Page is Missing
**Pages:** `/goals`, `/register` [sudar-learn.vercel](https://sudar-learn.vercel.app/goals)
**Issue:** The default Next.js black-screen 404 is shown — no branding, no navigation, no CTA to go back home.
**Fix:** Create a `pages/404.js` (or `app/not-found.tsx`) with the Sudar branding, a helpful message, and a "Go back home" button.

### 5. Wrong Time-of-Day Greeting
**Page:** Dashboard [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** Dashboard says "Good evening, Dhanikesh" at 1 AM IST — the greeting is based on incorrect timezone logic. It should say "Good night" or "Good morning".
**Fix:** Use the user's local timezone (from browser `Intl.DateTimeFormat`) to calculate the time-of-day greeting bucket correctly, especially distinguishing midnight–5 AM as "Good night".

### 6. Search Bar Has No Functionality
**Page:** All pages (top nav) [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/929d1845-ac19-4274-9460-6911d84f091a)
**Issue:** The global search bar accepts input and pressing Enter does nothing — no dropdown suggestions, no results page navigation, no response.
**Fix:** Implement a search results dropdown (typeahead) that shows matching courses, paths, and modules. On Enter, navigate to a `/search?q=` results page.

### 7. Inconsistent Progress Data Between Pages
**Page:** Dashboard vs. Progress vs. Course Catalog [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** Dashboard shows "Courses done: 0" and "Learning time: 6500 hrs", but the Courses page says "9 in progress · 9 completed". The Progress page shows "Courses in progress: 0, Courses completed: 0". The leaderboard shows "348,854 minutes" which equals ~5,814 hrs — yet the dashboard shows "6503 hrs" then "6500 hrs" on refresh. Data is inconsistent across views.
**Fix:** Unify data fetching to a single source of truth (a shared API endpoint or React Query/SWR cache). Audit all "completed" and "in progress" counting logic — enrollment status vs. module completion appear to be counted differently across pages.

### 8. Flash of Blank Page on Navigation
**Pages:** Courses, individual course detail [sudar-learn.vercel](https://sudar-learn.vercel.app/courses)
**Issue:** Navigating to `/courses` or a specific course URL briefly shows a completely blank white screen with just the navbar before content loads — no skeleton loader or loading state.
**Fix:** Add skeleton/shimmer loading states for the course catalog grid and course detail page. Use `Suspense` boundaries in Next.js App Router or loading.tsx files.

### 9. Cards Tab Shows "No flashcards could be generated"
**Page:** Module lesson view → Cards tab [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The Cards tab (flashcards) silently fails with "No flashcards could be generated for this module." There is a "Try again" link but no explanation.
**Fix:** Show a better error state explaining why (e.g., "Content is too short" or "Generation failed — try again in a moment"). Log errors server-side to debug root cause. Pre-generate flashcards when a module is created rather than on-demand.

### 10. `Watch` Tab Shows Scriptwriting Metadata in Content
**Page:** Module lesson view → Watch tab [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The Watch slides show italicised production notes like *"Visuals: Show title card with animation and background music"* — this is script/prompt output that was meant for video production, not for learners.
**Fix:** Strip or separate production notes from the learner-facing slide content. Add a post-processing step that removes italic-formatted production instructions before rendering to learners.

### 11. `Listen` and `Podcast` Show "No audio — generate in Studio"
**Page:** Module lesson view → Listen / Podcast tabs [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** Both audio modes show ungenerated states to the learner with a message pointing them to "Studio". Learners should never see internal studio references.
**Fix:** Either auto-generate audio when a course is published, or hide the Listen/Podcast tabs entirely until audio is ready. Don't expose Studio references to the learner-facing LMS.

***

## ⚠️ UX & DESIGN ISSUES

### 12. Navbar Logo is Cut Off
**Page:** All pages [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** The Sudar logo/wordmark in the top-left is partially clipped — the "S" in "Sudar" is cut at the left viewport edge.
**Fix:** Add adequate left padding/margin to the navbar container (`px-4` or `ml-4`).

### 13. Course Cards Have No Thumbnail / Visual Differentiation
**Page:** Course Catalog [sudar-learn.vercel](https://sudar-learn.vercel.app/courses)
**Issue:** All course cards show the same generic purple book icon. There's no way to visually distinguish courses at a glance.
**Fix:** Support auto-generated cover images (e.g., gradient with course title initials, or AI-generated thumbnails). Allow admins to upload a course thumbnail.

### 14. Duplicate Course Names with No Differentiator
**Page:** Course Catalog [sudar-learn.vercel](https://sudar-learn.vercel.app/courses)
**Issue:** There are 3 courses named "Somehow I manage" and 2 named "Introduction to Python" with no differentiating subtitle or date shown on the card.
**Fix:** Show a course creation date or a short unique description on the card. Consider enforcing unique course names, or showing a version/date suffix.

### 15. "No courses yet" State on Dashboard Despite Enrolled Courses
**Page:** Dashboard [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** The dashboard's "Your courses" section in the right sidebar says "No courses yet. Browse the catalog to get started." even though the user is enrolled in 18 courses. This is confusing.
**Fix:** Fix the enrollment check logic that feeds the dashboard sidebar. It should pull from the same enrollment data as the Courses page.

### 16. Leaderboard Shows Only One Entry
**Page:** Dashboard [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** The leaderboard only shows the logged-in user (#1). A leaderboard with one person is meaningless and looks incomplete.
**Fix:** Either show top N users from the same organisation, or hide the leaderboard until there are at least 2 users. Consider showing anonymised peer data ("You're ahead of 3 other learners in your team").

### 17. Activity Chart is Misleading — "Monday" is Missing
**Page:** Dashboard [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** The "Activity – Last 7 Days" chart shows Tue through Sun but skips Monday. Since the current day is Monday, it should appear.
**Fix:** Fix the chart's date range to show the correct 7-day window ending today. Ensure the chart always shows 7 bars including the current day.

### 18. Progress Page "Distribution" Pie Chart Has No Legend
**Page:** Progress [sudar-learn.vercel](https://sudar-learn.vercel.app/progress)
**Issue:** The "Distribution" donut chart shows a pink/magenta slice but there's no label, legend, or tooltip to indicate what the segment means.
**Fix:** Add a colour-coded legend (e.g., "In Progress", "Completed", "Not Started") and tooltips on hover. Include percentage values.

### 19. Path Detail Page — Course Flow Diagram Has No Visual State Differentiation
**Page:** Path detail [sudar-learn.vercel](https://sudar-learn.vercel.app/paths/6235b0b2-24f4-49d5-a655-f38aba031297)
**Issue:** The course flow diagram (bubble chart showing 3 courses) shows all courses with green checkmarks even though overall progress is 0%. The visual implies everything is done.
**Fix:** Differentiate bubble states clearly: locked (grey), in progress (blue/yellow), completed (green). Don't show green checkmarks unless the module/course is genuinely completed.

### 20. Memory Page — "Sudar's Memory" Title is Duplicated
**Page:** Memory [sudar-learn.vercel](https://sudar-learn.vercel.app/memory)
**Issue:** The page renders the "Sudar's Memory" heading and intro copy twice (once large, once smaller). This is a JSX rendering duplication bug.
**Fix:** Remove the duplicate rendering block. Likely a component being rendered twice in the layout or page component.

### 21. Module Sidebar Has No Visual State for "Not Started"
**Page:** Lesson view [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** In the left sidebar, completed modules show a green checkmark and strikethrough. But unstarted modules have no icon — it's hard to tell at a glance what's done vs. not started vs. in progress.
**Fix:** Add three clear states to the module list: ✅ Completed (green check), ▶ In Progress (blue dot or half-circle), ○ Not Started (empty circle/grey).

### 22. "Completed" Button State is Confusing on Already-Completed Modules
**Page:** Lesson view [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The bottom action bar shows a green "Completed" button on a module already marked done. It's unclear if clicking it will un-complete it or do nothing.
**Fix:** Change the completed CTA to "Mark as incomplete" with a clear toggle affordance, or show "Next module →" as the primary action once a module is complete.

***

## 🔒 MISSING FEATURES / FUNCTIONALITY GAPS

### 23. No Forgot Password Flow
**Page:** Login [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** The login form has no "Forgot password?" link. Users who forget credentials have no self-service recovery.
**Fix:** Add a "Forgot password?" link that triggers an email-based reset flow (`/forgot-password` route).

### 24. No User Registration / Self-Signup Flow
**Page:** Login [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** "Create one" on the login page leads to 404. There is no way for new users to self-register.
**Fix:** Build a `/register` page with name, email, password fields. Or, if this is invite-only, replace "Create one" with "Contact your admin for access."

### 25. No Quizzes / Assessments
**Page:** Module lesson view [sudar-learn.vercel](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** Despite having a rich multimodal content experience (Read, Listen, Watch, Podcast, Map, Cards, Ask Sudar), there are no quizzes, tests, or knowledge checks. This is a major LMS gap.
**Fix:** Add a "Quiz" tab to each module. Auto-generate 3–5 questions from the module content using the AI. Track quiz scores in progress. Gate course completion behind a minimum quiz score (optional, admin-configurable).

### 26. No Course Completion Certificate Download
**Page:** Course detail, Progress page
**Issue:** Paths show "Issues certificate on completion" and the Progress page has a Certificates section, but with 0 certificates and no way to download or preview one.
**Fix:** Generate a PDF certificate on course/path completion using a template with the learner's name, course name, and date. Surface it in Progress > Certificates with a download button.

### 27. No Instructor / Admin Role-Based View
**Page:** All pages
**Issue:** There's no visible admin panel, content management, or course creation UI in the learner app. While there may be a separate Studio, there's no link, role indicator, or transition for admin users.
**Fix:** Add a role-aware "Admin" or "Studio" button in the profile dropdown for users with admin/instructor permissions. Make the Studio accessible from within the LMS.

### 28. No Notifications System
**Page:** All pages
**Issue:** There's no notification bell or notification centre. Learners can't be alerted about new courses assigned, deadlines, streak reminders, or quiz results.
**Fix:** Add a notification bell icon in the navbar. Implement in-app notifications for: new course assignments, streak milestones, completed paths/certificates, AI-generated study reminders.



29. "Goals" Feature is Linked but Not Built
Page: More dropdown → Goals
​
Issue: A "Goals" link exists in the More dropdown but goes to a 404. This is a promised feature that breaks trust.
Fix: Either build the Goals page (allow learners to set weekly learning targets, track hours, etc.) or remove the link entirely until it's ready.

30. No Mobile Responsiveness Verified
Page: All pages
Issue: The entire layout appears built for desktop (fixed-width navbar, two-column dashboard). No mobile breakpoints were visible.
Fix: Test and implement responsive layouts for: navbar (hamburger menu on mobile), course cards (single column on mobile), lesson view (collapsible sidebar), Memory page cards (stacked layout).

📊 DATA / CONTENT QUALITY ISSUES
31. Course Descriptions Contain Prompt Text
Page: Course Catalog
​
Issue: Several course descriptions read like AI prompts rather than polished course summaries (e.g., "make it engaging and funny and relatable to the series", "Teach this course to absolute eginners" [sic]).
Fix: Add a post-generation review step before publishing. Either manually clean descriptions or add an AI "polish" pass that converts prompt-style instructions into learner-facing descriptions. Fix typo "eginners" → "beginners".

32. "Somehow I Manage" Appears 3 Times in Catalog
Page: Course Catalog
​
Issue: Three duplicate/variant courses with the same name coexist in the catalog with no differentiation.
Fix: Implement a course versioning or draft system so that iterative builds don't pollute the catalog. Add a "published" vs "draft" state — only published courses should appear in the learner catalog.

33. Learning Time Shows Impossible Value: "348,854 minutes" / "5,814 hours"
Page: Dashboard
​
Issue: "348,854 minutes" = 241 days of continuous learning. This is clearly a data bug (possibly tracking active browser tab time rather than actual engaged learning).
Fix: Audit the time-tracking logic. Only count time when the user is actively interacting with lesson content (scroll, click, play). Cap sessions at a reasonable max (e.g., 60 minutes per session). Add anomaly detection for session lengths over 2 hours.

🎨 POLISH & MICRO-UX
34. Page Titles Are Generic — All Say "Sudar Learn"
All pages share the same <title> tag. Every tab in the browser shows "Sudar Learn" with no page-specific context.
Fix: Set dynamic page titles: "Courses | Sudar Learn", "How to Reduce AHT | Sudar Learn", etc.

35. No Breadcrumb on Lesson Page
On the lesson view, the top-left shows "← Course details" but no full breadcrumb like Courses > How to Reduce AHT > Module 1.
Fix: Add a full breadcrumb trail for context and easier navigation.

36. "Ask Sudar" Panel Lacks Persistence / History
When you close and reopen the Ask Sudar panel, the conversation appears to reset. There's no visible conversation history.
Fix: Persist the conversation per-module (or per-course) in localStorage or the backend so learners can refer back to prior explanations.

37. No Keyboard Navigation / Accessibility
Tab order, focus states, and ARIA labels need a review. The lesson view's content tabs (Read, Listen, Watch, etc.) should be navig

### 29. "Goals" Feature is Linked but Not Built
**Page:** More dropdown → Goals [sudar-learn.vercel](https://sudar-learn.vercel.app/goals)
**Issue:** A "Goals" link exists in the More dropdown but goes to a 404. This is a promised feature that breaks trust.
**Fix:** Either build the Goals page (allow learners to set weekly learning targets, track hours, etc.) or remove the link entirely until it's ready.

### 30. No Mobile Responsiveness Verified
**Page:** All pages
**Issue:** The entire layout appears built for desktop (fixed-width navbar, two-column dashboard). No mobile breakpoints were visible.
**Fix:** Test and implement responsive layouts for: navbar (hamburger menu on mobile), course cards (single column on mobile), lesson view (collapsible sidebar), Memory page cards (stacked layout).

***

## 📊 DATA / CONTENT QUALITY ISSUES

### 31. Course Descriptions Contain Prompt Text
**Page:** Course Catalog [sudar-learn.vercel](https://sudar-learn.vercel.app/courses)
**Issue:** Several course descriptions read like AI prompts rather than polished course summaries (e.g., "make it engaging and funny and relatable to the series", "Teach this course to absolute eginners" [sic]).
**Fix:** Add a post-generation review step before publishing. Either manually clean descriptions or add an AI "polish" pass that converts prompt-style instructions into learner-facing descriptions. Fix typo "eginners" → "beginners".

### 32. "Somehow I Manage" Appears 3 Times in Catalog
**Page:** Course Catalog [sudar-learn.vercel](https://sudar-learn.vercel.app/courses)
**Issue:** Three duplicate/variant courses with the same name coexist in the catalog with no differentiation.
**Fix:** Implement a course versioning or draft system so that iterative builds don't pollute the catalog. Add a "published" vs "draft" state — only published courses should appear in the learner catalog.

### 33. Learning Time Shows Impossible Value: "348,854 minutes" / "5,814 hours"
**Page:** Dashboard [sudar-learn.vercel](https://sudar-learn.vercel.app/)
**Issue:** "348,854 minutes" = 241 days of continuous learning. This is clearly a data bug (possibly tracking active browser tab time rather than actual engaged learning).
**Fix:** Audit the time-tracking logic. Only count time when the user is actively interacting with lesson content (scroll, click, play). Cap sessions at a reasonable max (e.g., 60 minutes per session). Add anomaly detection for session lengths over 2 hours.

***

## 🎨 POLISH & MICRO-UX

### 34. Page Titles Are Generic — All Say "Sudar Learn"
All pages share the same `<title>` tag. Every tab in the browser shows "Sudar Learn" with no page-specific context.
**Fix:** Set dynamic page titles: `"Courses | Sudar Learn"`, `"How to Reduce AHT | Sudar Learn"`, etc.

### 35. No Breadcrumb on Lesson Page
On the lesson view, the top-left shows "← Course details" but no full breadcrumb like `Courses > How to Reduce AHT > Module 1`.
**Fix:** Add a full breadcrumb trail for context and easier navigation.

### 36. "Ask Sudar" Panel Lacks Persistence / History
When you close and reopen the Ask Sudar panel, the conversation appears to reset. There's no visible conversation history.
**Fix:** Persist the conversation per-module (or per-course) in localStorage or the backend so learners can refer back to prior explanations.


### 37. No Keyboard Navigation / Accessibility
**Page:** Lesson view, all pages [https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The lesson view content tabs (Read, Listen, Watch, Podcast, Map, Cards, Ask Sudar) are not navigable via keyboard Tab/Arrow keys. There are no visible focus rings on interactive elements, no `aria-selected` states on the tab row, and no `role="tablist"` / `role="tab"` ARIA structure. The module sidebar items also lack accessible labels.
**Fix:** Implement the WAI-ARIA Tabs pattern: add `role="tablist"` to the tab container, `role="tab"` + `aria-selected` to each tab, and `role="tabpanel"` to each content area. Use arrow keys to cycle tabs. Add `:focus-visible` ring styles globally (e.g., `outline: 2px solid #7C3AED`). Audit all buttons and links for missing `aria-label` attributes.

***

### 38. No "Continue Where You Left Off" on Dashboard
**Page:** Dashboard [https://sudar-learn.vercel.app/](https://sudar-learn.vercel.app/)
**Issue:** The dashboard hero section says "Start learning by enrolling in a course" — even for a user with 18 enrolled courses and active progress. There is no "Resume" card pointing the user to their last active module.
**Fix:** Track `last_visited_module` per user (timestamp + module ID + course ID). On the dashboard, show a prominent "Continue learning" card: course thumbnail, course name, module name, and a "Resume →" button that deep-links directly to that module.

***

### 39. Course Detail Page Has No Enrol / Start Button for 0% Courses
**Page:** Course detail [https://sudar-learn.vercel.app/courses/6dffa5b0-6917-4974-9943-9642bc14e576](https://sudar-learn.vercel.app/courses/6dffa5b0-6917-4974-9943-9642bc14e576)
**Issue:** For courses showing 0% progress, the page has no clear primary CTA. The "Continue learning" button only appears on in-progress courses. New or unenrolled courses have no obvious action.
**Fix:** Add a conditional primary CTA block below the progress bar:
- 0%, not enrolled → **"Enrol & Start Course"** (full-width purple button)
- 0%, enrolled → **"Start Course"**
- 1–99% → **"Continue Learning"**
- 100% → **"Review Course"**

***

### 40. Memory "Insights" Carousel Has No Visible Navigation Controls on Desktop
**Page:** Memory [https://sudar-learn.vercel.app/memory](https://sudar-learn.vercel.app/memory)
**Issue:** The "Insights from your learning" section has 11 insight cards in a carousel (`Go to insight 1` through `Go to insight 11`) but the navigation dots/arrows are not visible or intuitive. Users may not realise there are 10 more insights to scroll through.
**Fix:** Add clearly visible left/right arrow buttons on either side of the carousel. Show a dot indicator row (e.g., ● ○ ○ ○) below the card. Consider showing 2–3 insight cards at once on desktop instead of one at a time.

***

### 41. No "Save Progress" Confirmation or Auto-Save Indicator
**Page:** Lesson view [https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** When a learner reads a module and moves to the next one, there is no indicator that their progress has been saved. Learners may be anxious about losing progress if they close the tab.
**Fix:** Show a subtle auto-save indicator (e.g., "Progress saved ✓" in the top bar, fading out after 2 seconds) whenever a module is marked complete or navigated away from. This builds confidence, especially for corporate learners.

***

### 42. No Estimated Time to Complete on Course Cards or Course Detail
**Page:** Course Catalog [https://sudar-learn.vercel.app/courses](https://sudar-learn.vercel.app/courses), Course detail
**Issue:** Only a handful of courses show an estimated duration (e.g., "5m", "10m", "30m") on their cards. Most show nothing. This makes it impossible for learners to plan their time.
**Fix:** Make estimated duration a required field at course creation. If not manually set, auto-calculate it: `total_word_count / 200 words-per-minute` for Read content, plus audio duration for Listen/Podcast, plus slide count × 30 seconds for Watch. Display it prominently on every course card and at the top of the course detail page.

***

### 43. Paths Page Only Shows One Path with Placeholder Name "Test"
**Page:** Paths [https://sudar-learn.vercel.app/paths](https://sudar-learn.vercel.app/paths)
**Issue:** The entire Paths page shows one path simply named "Test" with description "Test". This is a test/placeholder record that is visible to all learners. There is also no empty state for users with no paths.
**Fix:** Add a `published` flag to learning paths (same as courses). Only show paths where `published = true` in the learner-facing LMS. Archive or delete the "Test" path. Add an empty state component: "No learning paths have been assigned to you yet."

***

### 44. No User Profile Page
**Page:** Profile dropdown [https://sudar-learn.vercel.app/](https://sudar-learn.vercel.app/)
**Issue:** The profile dropdown only shows: Theme toggle, Colour palette, Sudar's Memory link, and Sign out. There is no dedicated profile page where users can update their name, email, password, profile photo, or notification preferences.
**Fix:** Add a `/profile` or `/settings` route. Include sections for: Personal info (name, email, avatar), Password change, Notification preferences (email digest, streak reminders), Language/timezone settings, and Danger zone (delete account).

***

### 45. Mind Map ("Map" Tab) Loads Indefinitely Without Timeout Handling
**Page:** Lesson view → Map tab [https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** Clicking the Map tab triggers "Sudar is building your mindmap..." with a spinner, but there is no timeout, no error fallback, and no maximum wait time shown to the user. If the generation API fails silently, the user sees an infinite spinner.
**Fix:** Add a 15-second timeout. If generation hasn't completed, show: "Mind map is taking longer than usual — [Try again] or [Skip for now]." Log timed-out generation attempts for monitoring.

***

### 46. Podcast Transcript Shows No Speaker Role Differentiation Beyond "HOST"
**Page:** Lesson view → Podcast tab [https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The transcript only labels the speaker as "HOST" for every line. If there are multiple speakers (host + guest), they would all appear identical with no visual differentiation.
**Fix:** Assign distinct colour-coded speaker labels (HOST in purple, GUEST in teal, etc.). If it's a single-speaker podcast, the label can be removed or replaced with the course/module name for context.

***

### 47. No "Report an Issue" or Feedback Mechanism for Learners
**Page:** All pages, especially lesson view
**Issue:** If a learner encounters incorrect content, a broken module, or a confusing explanation, there is no way to flag it. The only option is to use Ask Sudar, which routes to the AI — not to the admin/instructor.
**Fix:** Add a small "Report an issue" link (e.g., a flag icon) on each module page. On click, show a short form: dropdown for issue type (Wrong content / Broken audio / Broken video / Other) + optional comment. Route submissions to an admin dashboard or email.

***

### 48. Lesson View Has No Progress Indicator Within the Module Content Itself
**Page:** Lesson view → Read tab [https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546](https://sudar-learn.vercel.app/courses/157f47d4-f7dc-4267-863e-e482f2abd67c/learn?module=171ae47a-ee22-4e77-8533-d32ad60e6546)
**Issue:** The Read tab for a module can be a long wall of text with no indication of how far through the content the learner is. There's no scroll progress bar, word count, or estimated reading time displayed.
**Fix:** Add a thin reading progress bar at the top of the content area (like Medium articles) that fills as the user scrolls. Show "~4 min read" at the top of each Read tab based on word count. Auto-trigger "Completed" only after the user has scrolled to the bottom, rather than allowing immediate marking.

***

## 📋 PRIORITY SUMMARY FOR CURSOR

Use this as your implementation checklist, ordered by impact:

| Priority | # | Item | Category |
|---|---|---|---|
| 🔴 Critical | 3 | `/register` 404 — no signup flow | Bug |
| 🔴 Critical | 6 | Search bar non-functional | Bug |
| 🔴 Critical | 7 | Inconsistent progress data across pages | Bug |
| 🔴 Critical | 25 | No quizzes / assessments | Feature |
| 🔴 Critical | 33 | Impossible learning time (348,854 min) | Data |
| 🟠 High | 1 | "More" dropdown clipped off-screen | Bug |
| 🟠 High | 2 | `/goals` 404 | Bug |
| 🟠 High | 4 | No branded 404 page | Bug |
| 🟠 High | 5 | Wrong time-of-day greeting | Bug |
| 🟠 High | 8 | Blank page flash on navigation | Bug |
| 🟠 High | 10 | Watch tab leaks production script notes | Bug |
| 🟠 High | 11 | Listen/Podcast show Studio references | Bug |
| 🟠 High | 15 | Dashboard sidebar says "No courses" despite 18 enrolments | UX |
| 🟠 High | 20 | Memory page title rendered twice | Bug |
| 🟠 High | 23 | No forgot password flow | Feature |
| 🟠 High | 26 | Certificate download not implemented | Feature |
| 🟠 High | 38 | No "Continue where you left off" | UX |
| 🟠 High | 44 | No user profile / settings page | Feature |
| 🟡 Medium | 9 | Flashcards fail silently | Bug |
| 🟡 Medium | 12 | Logo clipped in navbar | UX |
| 🟡 Medium | 13 | No course thumbnails | UX |
| 🟡 Medium | 16 | Leaderboard shows 1 person | UX |
| 🟡 Medium | 17 | Activity chart missing Monday | Bug |
| 🟡 Medium | 18 | Distribution chart has no legend | UX |
| 🟡 Medium | 19 | Path diagram wrong visual states | UX |
| 🟡 Medium | 21 | Module sidebar missing state icons | UX |
| 🟡 Medium | 22 | "Completed" button confusing | UX |
| 🟡 Medium | 28 | No notifications system | Feature |
| 🟡 Medium | 30 | No mobile responsiveness | Feature |
| 🟡 Medium | 31 | Course descriptions contain prompt text | Content |
| 🟡 Medium | 34 | Generic page titles | Polish |
| 🟡 Medium | 37 | No keyboard / accessibility | Polish |
| 🟡 Medium | 39 | No Enrol/Start CTA on 0% courses | UX |
| 🟡 Medium | 42 | No estimated time to complete | UX |
| 🟡 Medium | 45 | Mind map infinite spinner | Bug |
| 🟡 Medium | 47 | No feedback / issue reporting | Feature |
| 🟡 Medium | 48 | No scroll progress in Read tab | UX |
| 🟢 Low | 14 | Duplicate course names | Content |
| 🟢 Low | 27 | No admin/Studio link for admin users | Feature |
| 🟢 Low | 29 | Goals feature linked but not built | Feature |
| 🟢 Low | 32 | Draft courses visible in catalog | Content |
| 🟢 Low | 35 | No breadcrumb on lesson page | Polish |
| 🟢 Low | 36 | Ask Sudar loses conversation history | UX |
| 🟢 Low | 40 | Memory carousel controls not visible | UX |
| 🟢 Low | 41 | No auto-save confirmation | UX |
| 🟢 Low | 43 | "Test" path visible to learners | Content |
| 🟢 Low | 46 | Podcast only labels "HOST" | Polish |

***

**Total issues found: 48**
- 🔴 Critical: 5
- 🟠 High: 13
- 🟡 Medium: 20
- 🟢 Low: 10