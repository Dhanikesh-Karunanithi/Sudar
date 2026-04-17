'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Code, Copy, Download, Sparkles, Image as ImageIcon } from 'lucide-react'
import type { SceneSpec } from '@shared-sudarart/schema'
import { compileScene } from '@shared-sudarart/compiler'

interface Generation {
  id: string
  prompt: string
  spec: SceneSpec
  html: string
  css: string
  timestamp: number
}

export default function SudarArtPage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentGen, setCurrentGen] = useState<Generation | null>(null)
  const [history, setHistory] = useState<Generation[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sudarart_studio_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Generation[]
        setHistory(parsed)
        if (parsed.length > 0) setCurrentGen(parsed[0])
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('sudarart_studio_history', JSON.stringify(history))
    }
  }, [history])

  useEffect(() => {
    if (currentGen && iframeRef.current) {
      const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <style>${currentGen.css}</style>
  </head>
  <body>
    ${currentGen.html}
  </body>
</html>`
      iframeRef.current.srcdoc = fullHtml
    }
  }, [currentGen])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/sudarart/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Generation failed')
      }

      const spec = (await res.json()) as SceneSpec
      const { html, css } = compileScene(spec)

      const newGen: Generation = {
        id: Math.random().toString(36).substring(2, 9),
        prompt,
        spec,
        html,
        css,
        timestamp: Date.now(),
      }

      setCurrentGen(newGen)
      setHistory((prev) => [newGen, ...prev].slice(0, 20))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyHtml = () => {
    if (!currentGen) return
    const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${currentGen.css}\n</style>\n</head>\n<body>\n${currentGen.html}\n</body>\n</html>`
    void navigator.clipboard.writeText(fullHtml)
  }

  const downloadHtml = () => {
    if (!currentGen) return
    const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${currentGen.css}\n</style>\n</head>\n<body>\n${currentGen.html}\n</body>\n</html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sudarart-${currentGen.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyReact = () => {
    if (!currentGen) return
    const jsxHtml = currentGen.html
      .replace(/class=/g, 'className=')
      .replace(/<!--/g, '{/*')
      .replace(/-->/g, '*/}')

    const reactCode = `import React from 'react';

export default function SudarArtComponent() {
  return (
    <>
      <style>{\`${currentGen.css}\`}</style>
      ${jsxHtml}
    </>
  );
}
`
    void navigator.clipboard.writeText(reactCode)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-50 font-sans flex flex-col md:flex-row">
      <div className="w-full md:w-96 border-r border-neutral-800 flex flex-col bg-neutral-900/50">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400" aria-hidden />
            SudarArt
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            AI-assisted CSS-only illustration generator. Uses a strict compiler architecture to ensure valid, scalable
            CSS art.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label htmlFor="sudarart-prompt" className="block text-sm font-medium text-neutral-300 mb-2">
                Describe your scene
              </label>
              <textarea
                id="sudarart-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cyberpunk character with spiky neon pink hair and glowing glasses..."
                className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              aria-label={isGenerating ? 'Generating art' : 'Generate art from prompt'}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                  Compiling...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" aria-hidden />
                  Generate Art
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-lg text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-12">
              <h2 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">Recent Generations</h2>
              <div className="space-y-2">
                {history.map((gen) => (
                  <button
                    key={gen.id}
                    type="button"
                    onClick={() => setCurrentGen(gen)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors text-sm truncate ${
                      currentGen?.id === gen.id
                        ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {gen.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[50vh] md:min-h-0 md:h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950 relative">
        {currentGen ? (
          <>
            <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => copyHtml()}
                className="bg-neutral-900/80 backdrop-blur border border-neutral-700 hover:bg-neutral-800 text-neutral-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
                aria-label="Copy HTML to clipboard"
              >
                <Copy className="w-4 h-4" aria-hidden />
                Copy HTML
              </button>
              <button
                type="button"
                onClick={() => copyReact()}
                className="bg-neutral-900/80 backdrop-blur border border-neutral-700 hover:bg-neutral-800 text-neutral-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
                aria-label="Copy React component to clipboard"
              >
                <Code className="w-4 h-4" aria-hidden />
                Copy React
              </button>
              <button
                type="button"
                onClick={() => downloadHtml()}
                className="bg-indigo-600/90 backdrop-blur border border-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
                aria-label="Download HTML file"
              >
                <Download className="w-4 h-4" aria-hidden />
                Download
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="w-full flex-1 min-h-0 border-none bg-white"
              title="SudarArt preview"
              sandbox="allow-scripts"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 p-8 text-center">
            <ImageIcon className="w-16 h-16 mb-4 opacity-20" aria-hidden />
            <h2 className="text-xl font-medium mb-2">No Art Generated Yet</h2>
            <p className="max-w-md">
              Enter a prompt on the left to generate a CSS-only illustration. The AI will map your request to our
              strict scene schema.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
