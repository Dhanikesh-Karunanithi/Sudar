import type { ProactiveChoiceParsed } from '@/lib/tutor/proactivePromptSchema'

export type ProactiveTemplateResult = {
  message: string
  choices: ProactiveChoiceParsed[]
  /** When false, caller should skip showing (no spam on generic routes). */
  show: boolean
}

const DISMISS: ProactiveChoiceParsed = {
  id: 'dismiss',
  label: 'Not now',
  follow_up_message: '',
}

function baseContinueChoices(): ProactiveChoiceParsed[] {
  return [
    {
      id: 'next',
      label: 'What should I learn next?',
      follow_up_message: 'What should I learn next?',
    },
    {
      id: 'browse',
      label: 'Show me courses',
      follow_up_message: 'Show me available courses I can take.',
    },
    {
      id: 'progress',
      label: 'Show my progress',
      follow_up_message: 'Show me my learning progress.',
    },
    DISMISS,
  ]
}

export function templateSessionStart(): ProactiveTemplateResult {
  return {
    show: true,
    message: 'Welcome back — what would you like to do?',
    choices: baseContinueChoices(),
  }
}

/**
 * Maps dashboard pathname to a contextual prompt (templates only).
 * @param isRouteChange When true, `/` is suppressed so it does not duplicate `session_start`.
 */
export function templateForRoute(pathname: string | null, isRouteChange?: boolean): ProactiveTemplateResult {
  if (!pathname || pathname === '/') {
    if (isRouteChange) {
      return { show: false, message: '', choices: [] }
    }
    return templateSessionStart()
  }

  if (pathname.startsWith('/courses')) {
    const isLearn = /\/courses\/[^/]+\/learn/.test(pathname)
    if (isLearn) {
      return { show: false, message: '', choices: [] }
    }
    return {
      show: true,
      message: 'Here in your catalog — want to browse or pick up where you left off?',
      choices: [
        {
          id: 'continue_course',
          label: 'Continue my courses',
          follow_up_message: 'What should I learn next from my enrolled courses?',
        },
        {
          id: 'browse',
          label: 'Browse all courses',
          follow_up_message: 'Show me available courses I can take.',
        },
        DISMISS,
      ],
    }
  }

  if (pathname.startsWith('/progress')) {
    return {
      show: true,
      message: 'Checking your progress — want a quick summary from Sudar?',
      choices: [
        {
          id: 'summarize',
          label: 'Summarize my progress',
          follow_up_message: 'Summarize my learning progress and what to focus on next.',
        },
        {
          id: 'streak',
          label: 'How is my streak?',
          follow_up_message: 'How is my learning streak and consistency?',
        },
        DISMISS,
      ],
    }
  }

  if (pathname.startsWith('/paths')) {
    return {
      show: true,
      message: 'Learning paths bundle courses in order — want help choosing?',
      choices: [
        {
          id: 'path_help',
          label: 'Help me pick a path',
          follow_up_message: 'Help me choose a learning path that fits my goals.',
        },
        {
          id: 'browse',
          label: 'Show available paths',
          follow_up_message: 'What learning paths are available for me?',
        },
        DISMISS,
      ],
    }
  }

  if (pathname.startsWith('/memory')) {
    return {
      show: true,
      message: 'Your memory helps Sudar personalize answers — want to review or adjust?',
      choices: [
        {
          id: 'memory_tips',
          label: 'How does memory work?',
          follow_up_message: 'Explain how My Memory works and what I should add.',
        },
        {
          id: 'prefs',
          label: 'Suggest preference updates',
          follow_up_message: 'Suggest learning preferences I could save based on my activity.',
        },
        DISMISS,
      ],
    }
  }

  if (pathname.startsWith('/search')) {
    return {
      show: true,
      message: 'Searching for something specific?',
      choices: [
        {
          id: 'search_help',
          label: 'Search tips',
          follow_up_message: 'Give me tips for finding the right course or module in Sudar.',
        },
        DISMISS,
      ],
    }
  }

  return { show: false, message: '', choices: [] }
}

export function idleNudgeFallbackChoices(): ProactiveChoiceParsed[] {
  return [
    {
      id: 'hint',
      label: 'Give me a hint',
      follow_up_message: 'Give me a short hint on this section without spoiling the quiz.',
    },
    {
      id: 'explain',
      label: 'Explain differently',
      follow_up_message: 'Explain this section in a simpler way with a concrete example.',
    },
    {
      id: 'dismiss',
      label: "I'm good, thanks",
      follow_up_message: '',
    },
  ]
}
