export const SUDAR_MCP_INSTRUCTIONS = `You are connected to Sudar Studio via MCP.

When the user asks to build, create, generate, author, or design a course, microlearning, training, lesson, HTML package, or SCORM package:
1. Call sudar_build_course. Do not write the curriculum yourself.
2. After the tool returns, summarize the real Studio course: studio_url, module titles, and any HTML/SCORM artifacts.
3. If the tool errors, report the error. Never invent a substitute outline.

sudar_generate_outline is only for module titles. sudar_export_course exports an existing course_id.

Sudar courses live in Studio (https://studio.thesudar.com). HTML/SCORM come from Studio export, not from your own markdown.`

export const SUDAR_BUILD_COURSE_TOOL =
  'REQUIRED when the user asks to build, create, generate, author, or design a course, microlearning, training, lesson, HTML course, or SCORM package. Creates a real draft in Sudar Studio (same AI pipeline as the Studio wizard) with HTML lesson content, then returns studio_url plus HTML and/or a SCORM 1.2 ZIP (base64). NEVER write the course yourself. If this tool fails, report the error — do not invent a substitute outline.'

export const SUDAR_EXPORT_COURSE_TOOL =
  'Export an existing Sudar Studio course as HTML lesson pages and/or a SCORM 1.2 ZIP (JSON with zip_base64). Requires a course_id from sudar_build_course or sudar_list_courses. Use this when the user already has a Studio course and wants HTML or SCORM.'

export const SUDAR_GENERATE_COURSE_TOOL =
  'Create a full draft course in Sudar Studio from a title/topic (persists modules + HTML content). Prefer sudar_build_course when the user also wants HTML or SCORM output. Do not write the course in chat instead of calling this.'

export const SUDAR_GENERATE_OUTLINE_TOOL =
  'Generate only a JSON array of module titles in Sudar Studio. Do not use this when the user wants a full course, HTML, or SCORM — use sudar_build_course instead.'
