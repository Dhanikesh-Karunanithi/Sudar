import type { ProactiveChoiceParsed } from '@/lib/tutor/proactivePromptSchema'

export type ProactiveTemplateResult = {
  message: string
  choices: ProactiveChoiceParsed[]
  /** When false, caller should skip showing (no spam on generic routes). */
  show: boolean
}

export type ProactiveTranslate = (key: string) => string

function tr(t: ProactiveTranslate | undefined, key: string, fallback: string) {
  if (!t) return fallback
  const v = t(key)
  return v === key ? fallback : v
}

function baseContinueChoices(t?: ProactiveTranslate): ProactiveChoiceParsed[] {
  return [
    {
      id: 'next',
      label: tr(t, 'Proactive.choiceNext', 'What should I learn next?'),
      follow_up_message: tr(t, 'Proactive.choiceNextFu', 'What should I learn next?'),
    },
    {
      id: 'browse',
      label: tr(t, 'Proactive.choiceBrowse', 'Show me courses'),
      follow_up_message: tr(t, 'Proactive.choiceBrowseFu', 'Show me available courses I can take.'),
    },
    {
      id: 'progress',
      label: tr(t, 'Proactive.choiceProgress', 'Show my progress'),
      follow_up_message: tr(t, 'Proactive.choiceProgressFu', 'Show me my learning progress.'),
    },
    {
      id: 'dismiss',
      label: tr(t, 'Proactive.dismiss', 'Not now'),
      follow_up_message: '',
    },
  ]
}

export function templateSessionStart(t?: ProactiveTranslate): ProactiveTemplateResult {
  return {
    show: true,
    message: tr(t, 'Proactive.sessionStartMessage', 'Welcome back — what would you like to do?'),
    choices: baseContinueChoices(t),
  }
}

/**
 * Maps dashboard pathname to a contextual prompt (templates only).
 * @param isRouteChange When true, `/` is suppressed so it does not duplicate `session_start`.
 */
export function templateForRoute(
  pathname: string | null,
  isRouteChange: boolean | undefined,
  t?: ProactiveTranslate,
): ProactiveTemplateResult {
  if (!pathname || pathname === '/') {
    if (isRouteChange) {
      return { show: false, message: '', choices: [] }
    }
    return templateSessionStart(t)
  }

  if (pathname.startsWith('/courses')) {
    const isLearn = /\/courses\/[^/]+\/learn/.test(pathname)
    if (isLearn) {
      return { show: false, message: '', choices: [] }
    }
    return {
      show: true,
      message: tr(t, 'Proactive.coursesCatalogMessage', 'Here in your catalog — want to browse or pick up where you left off?'),
      choices: [
        {
          id: 'continue_course',
          label: tr(t, 'Proactive.coursesContinueLabel', 'Continue my courses'),
          follow_up_message: tr(t, 'Proactive.coursesContinueFu', 'What should I learn next from my enrolled courses?'),
        },
        {
          id: 'browse',
          label: tr(t, 'Proactive.coursesBrowseLabel', 'Browse all courses'),
          follow_up_message: tr(t, 'Proactive.coursesBrowseFu', 'Show me available courses I can take.'),
        },
        {
          id: 'dismiss',
          label: tr(t, 'Proactive.dismiss', 'Not now'),
          follow_up_message: '',
        },
      ],
    }
  }

  if (pathname.startsWith('/progress')) {
    return {
      show: true,
      message: tr(t, 'Proactive.progressMessage', 'Checking your progress — want a quick summary from Sudar?'),
      choices: [
        {
          id: 'summarize',
          label: tr(t, 'Proactive.progressSummarizeLabel', 'Summarize my progress'),
          follow_up_message: tr(t, 'Proactive.progressSummarizeFu', 'Summarize my learning progress and what to focus on next.'),
        },
        {
          id: 'streak',
          label: tr(t, 'Proactive.progressStreakLabel', 'How is my streak?'),
          follow_up_message: tr(t, 'Proactive.progressStreakFu', 'How is my learning streak and consistency?'),
        },
        {
          id: 'dismiss',
          label: tr(t, 'Proactive.dismiss', 'Not now'),
          follow_up_message: '',
        },
      ],
    }
  }

  if (pathname.startsWith('/paths')) {
    return {
      show: true,
      message: tr(t, 'Proactive.pathsMessage', 'Learning paths bundle courses in order — want help choosing?'),
      choices: [
        {
          id: 'path_help',
          label: tr(t, 'Proactive.pathsHelpLabel', 'Help me pick a path'),
          follow_up_message: tr(t, 'Proactive.pathsHelpFu', 'Help me choose a learning path that fits my goals.'),
        },
        {
          id: 'browse',
          label: tr(t, 'Proactive.pathsBrowseLabel', 'Show available paths'),
          follow_up_message: tr(t, 'Proactive.pathsBrowseFu', 'What learning paths are available for me?'),
        },
        {
          id: 'dismiss',
          label: tr(t, 'Proactive.dismiss', 'Not now'),
          follow_up_message: '',
        },
      ],
    }
  }

  if (pathname.startsWith('/memory')) {
    return {
      show: true,
      message: tr(t, 'Proactive.memoryMessage', 'Your memory helps Sudar personalize answers — want to review or adjust?'),
      choices: [
        {
          id: 'memory_tips',
          label: tr(t, 'Proactive.memoryTipsLabel', 'How does memory work?'),
          follow_up_message: tr(t, 'Proactive.memoryTipsFu', 'Explain how My Memory works and what I should add.'),
        },
        {
          id: 'prefs',
          label: tr(t, 'Proactive.memoryPrefsLabel', 'Suggest preference updates'),
          follow_up_message: tr(t, 'Proactive.memoryPrefsFu', 'Suggest learning preferences I could save based on my activity.'),
        },
        {
          id: 'dismiss',
          label: tr(t, 'Proactive.dismiss', 'Not now'),
          follow_up_message: '',
        },
      ],
    }
  }

  if (pathname.startsWith('/search')) {
    return {
      show: true,
      message: tr(t, 'Proactive.searchMessage', 'Searching for something specific?'),
      choices: [
        {
          id: 'search_help',
          label: tr(t, 'Proactive.searchHelpLabel', 'Search tips'),
          follow_up_message: tr(t, 'Proactive.searchHelpFu', 'Give me tips for finding the right course or module in Sudar.'),
        },
        {
          id: 'dismiss',
          label: tr(t, 'Proactive.dismiss', 'Not now'),
          follow_up_message: '',
        },
      ],
    }
  }

  return { show: false, message: '', choices: [] }
}

export function idleNudgeFallbackChoices(t?: ProactiveTranslate): ProactiveChoiceParsed[] {
  return [
    {
      id: 'hint',
      label: tr(t, 'Proactive.nudgeHintLabel', 'Give me a hint'),
      follow_up_message: tr(t, 'Proactive.nudgeHintFu', 'Give me a short hint on this section without spoiling the quiz.'),
    },
    {
      id: 'explain',
      label: tr(t, 'Proactive.nudgeExplainLabel', 'Explain differently'),
      follow_up_message: tr(t, 'Proactive.nudgeExplainFu', 'Explain this section in a simpler way with a concrete example.'),
    },
    {
      id: 'dismiss',
      label: tr(t, 'Proactive.nudgeDismissLabel', "I'm good, thanks"),
      follow_up_message: tr(t, 'Proactive.nudgeDismissFu', ''),
    },
  ]
}
