export const SUDAR_MCP_INSTRUCTIONS = `You are connected to Sudar Studio via MCP.

When the user asks to build, create, generate, author, or design a course, microlearning, training, lesson, HTML package, or SCORM package:
1. Call sudar_build_course. Do not write the curriculum yourself.
2. Give the user studio_url immediately (that is the real Studio course).
3. If generation_status is "running" or remaining_empty > 0, call sudar_get_course with course_id. Repeat until generation_completed is true (lessons fill in the background; wait about poll_after_seconds between checks). This is not a failure.
4. When remaining_empty is 0, call sudar_export_course for HTML and SCORM.
5. If a tool errors, report the error. Never invent a substitute outline.

sudar_generate_outline is only for module titles. sudar_export_course exports an existing course_id.

Sudar courses live in Studio (https://studio.thesudar.com). HTML/SCORM come from Studio export, not from your own markdown.`

export const SUDAR_BUILD_COURSE_TOOL =
  'REQUIRED when the user asks to build, create, generate, author, or design a course, microlearning, training, lesson, HTML course, or SCORM package. Creates a real draft in Sudar Studio immediately and fills HTML lessons in the background. Returns studio_url plus course_id. If generation_status is running, call sudar_get_course until remaining_empty is 0, then sudar_export_course. NEVER write the course yourself. If this tool fails, report the error — do not invent a substitute outline.'

export const SUDAR_GET_COURSE_TOOL =
  'Poll Studio course generation AND kick the next lesson fill. Use after sudar_build_course while remaining_empty > 0. Do not export until generation_completed is true.'

export const SUDAR_EXPORT_COURSE_TOOL =
  'Export an existing Sudar Studio course as HTML lesson pages and/or a SCORM 1.2 ZIP. Only call this when sudar_get_course reports generation_completed true / remaining_empty 0. If lessons are still empty, call sudar_get_course again instead.'

export const SUDAR_GENERATE_COURSE_TOOL =
  'Create a full draft course in Sudar Studio from a title/topic (persists modules + HTML content). Prefer sudar_build_course when the user also wants HTML or SCORM output. Do not write the course in chat instead of calling this.'

export const SUDAR_GENERATE_OUTLINE_TOOL =
  'Generate only a JSON array of module titles in Sudar Studio. Do not use this when the user wants a full course, HTML, or SCORM — use sudar_build_course instead.'
