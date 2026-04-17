'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileCode2, Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateHtmlForScormStorage } from '@/lib/scorm/validateHtmlForStorage'

interface ScormPackageHtmlEditorProps {
  courseId: string
  moduleId: string
  className?: string
}

type ListResponse = {
  files: string[]
  packageRoot: string
  launchUrl: string
}

/**
 * Pick an HTML file from the uploaded SCORM package, edit it, validate, and save back to storage.
 * The SCORM API shim is re-applied on save (same as import).
 */
export function ScormPackageHtmlEditor({ courseId, moduleId, className }: ScormPackageHtmlEditorProps) {
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [launchUrl, setLaunchUrl] = useState<string | null>(null)

  const [selectedPath, setSelectedPath] = useState<string>('')
  const [content, setContent] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const [validationHint, setValidationHint] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reextractMessage, setReextractMessage] = useState<string | null>(null)

  useEffect(() => {
    const listUrl = `/api/courses/${courseId}/modules/${moduleId}/scorm-file`
    let cancelled = false
    setListLoading(true)
    setListError(null)
    void (async () => {
      try {
        const res = await fetch(listUrl)
        const data = (await res.json().catch(() => ({}))) as ListResponse & { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Could not list package files')
        if (cancelled) return
        setFiles(data.files ?? [])
        setLaunchUrl(data.launchUrl ?? null)
        const first = data.files?.[0] ?? ''
        setSelectedPath(first)
      } catch (e) {
        if (!cancelled) setListError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId, moduleId])

  useEffect(() => {
    const fileUrlBase = `/api/courses/${courseId}/modules/${moduleId}/scorm-file`
    if (!selectedPath) {
      setContent('')
      return
    }
    let cancelled = false
    setFileLoading(true)
    setFileError(null)
    void (async () => {
      try {
        const res = await fetch(`${fileUrlBase}?path=${encodeURIComponent(selectedPath)}`)
        const data = (await res.json().catch(() => ({}))) as { content?: string; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Could not load file')
        if (cancelled) return
        setContent(typeof data.content === 'string' ? data.content : '')
      } catch (e) {
        if (!cancelled) setFileError(e instanceof Error ? e.message : 'Load failed')
      } finally {
        if (!cancelled) setFileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId, moduleId, selectedPath])

  const runValidate = useCallback(() => {
    setValidationHint(null)
    const r = validateHtmlForScormStorage(content)
    if (r.ok) {
      setValidationHint('Looks valid for save (basic checks). The SCORM shim will be re-injected on save.')
    } else {
      setValidationHint(r.error)
    }
  }, [content])

  const save = useCallback(async () => {
    setSaveError(null)
    setReextractMessage(null)
    const r = validateHtmlForScormStorage(content)
    if (!r.ok) {
      setSaveError(r.error)
      return
    }
    if (!selectedPath) {
      setSaveError('Select a file first.')
      return
    }
    setSaving(true)
    try {
      const putUrl = `/api/courses/${courseId}/modules/${moduleId}/scorm-file`
      const res = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      const rex = await fetch(`/api/courses/${courseId}/reextract-scorm`, { method: 'POST' })
      const rexData = (await rex.json().catch(() => ({}))) as { message?: string; error?: string }
      if (rex.ok) {
        setReextractMessage(rexData.message ?? 'Tutor text updated.')
      } else {
        setReextractMessage(
          rexData.error ? `Saved file, but tutor text refresh failed: ${rexData.error}` : 'Saved file.'
        )
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [content, courseId, moduleId, selectedPath])

  if (listLoading) {
    return (
      <section
        className={cn('mt-6 flex items-center gap-2 text-sm text-muted-foreground', className)}
        aria-busy="true"
        aria-label="Loading SCORM package files"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading package file list…
      </section>
    )
  }

  if (listError) {
    return (
      <section className={cn('mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200', className)}>
        {listError}
      </section>
    )
  }

  if (files.length === 0) {
    return (
      <section className={cn('mt-6 text-sm text-muted-foreground', className)}>
        No HTML files were found under this course&apos;s SCORM package.
      </section>
    )
  }

  return (
    <section
      className={cn('mt-8 rounded-xl border border-border bg-card/40 p-4 shadow-sm', className)}
      aria-label="Edit SCORM package HTML"
    >
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <FileCode2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500/90" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Edit packaged HTML</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Choose a file from your uploaded package, edit the source, validate, then save. Sudar re-injects the SCORM
            tracking shim on save. Reload the preview iframe to see changes. This replaces the file in storage for this
            course only.
          </p>
          {launchUrl ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Launch file (reference):{' '}
              <span className="font-mono text-[10px] text-foreground/80">{launchUrl}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">HTML file</span>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            aria-label="Select HTML file in SCORM package"
          >
            {files.map((f) => (
              <option key={f} value={f}>
                {f.replace(`scorm-packages/${courseId}/`, '')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fileLoading ? (
        <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading file…
        </p>
      ) : null}
      {fileError ? <p className="mb-2 text-xs text-red-400">{fileError}</p> : null}

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setValidationHint(null)
        }}
        disabled={fileLoading || !selectedPath}
        spellCheck={false}
        rows={22}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/80 p-3 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[320px]"
        aria-label="HTML source"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runValidate}
          disabled={!content.trim() || fileLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Validate
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || fileLoading || !selectedPath}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
          {saving ? 'Saving…' : 'Save to storage'}
        </button>
      </div>

      {validationHint ? (
        <p
          className={cn(
            'mt-3 flex items-start gap-2 text-xs',
            validationHint.startsWith('Looks valid') ? 'text-emerald-400/90' : 'text-amber-400/90'
          )}
        >
          {validationHint.startsWith('Looks valid') ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {validationHint}
        </p>
      ) : null}

      {saveError ? <p className="mt-2 text-xs text-red-400">{saveError}</p> : null}
      {reextractMessage ? <p className="mt-2 text-xs text-slate-400">{reextractMessage}</p> : null}
    </section>
  )
}
