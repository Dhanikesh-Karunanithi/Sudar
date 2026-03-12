'use client'

import { useState, useRef, useEffect } from 'react'

interface AlpEmbedChatProps {
  token: string
  userId: string
  courseId?: string
  moduleId?: string
}

export function AlpEmbedChat({ token, userId, courseId, moduleId }: AlpEmbedChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = message.trim()
    if (!text || loading) return
    setMessage('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/alp/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: userId,
          message: text,
          context_text: '',
          course_id: courseId,
          module_id: moduleId,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Request failed')
      }
      const data = (await res.json()) as { response?: string }
      setMessages((m) => [...m, { role: 'assistant', content: data.response ?? "I couldn't generate a response." }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
        <span className="text-indigo-400 font-medium text-sm">Sudar</span>
        <span className="text-slate-500 text-xs">Ask me anything about your course</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm">Type a question and press Enter or click Send.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Sudar..."
          className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !message.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
