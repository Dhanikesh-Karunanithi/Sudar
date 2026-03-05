'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Globe, FileText,
  Lock, Unlock, Zap, Award, Loader2, CheckCircle2, BookOpen, Route, UserPlus, Calendar, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PathCourse {
  course_id: string
  order_index: number
  is_mandatory: boolean
  title: string
  difficulty: string | null
  status: string
}

interface LearningPath {
  id: string
  title: string
  description: string | null
  status: string
  courses: PathCourse[]
  is_adaptive: boolean
  is_mandatory: boolean
  issues_certificate: boolean
}

interface AvailableCourse {
  id: string
  title: string
  difficulty: string | null
  status: string
}

export default function PathEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [path, setPath] = useState<LearningPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([])
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')
  const [pathEnrollments, setPathEnrollments] = useState<Array<{ id: string; user_id: string; full_name: string; status: string; progress_pct: number; due_date: string | null; completed_at: string | null }>>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [learners, setLearners] = useState<Array<{ id: string; full_name: string }>>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchPath = useCallback(async () => {
    const [pathRes, coursesRes, enrollmentsRes] = await Promise.all([
      fetch(`/api/paths/${id}`),
      fetch('/api/courses'),
      fetch(`/api/paths/${id}/enrollments`),
    ])
    if (!pathRes.ok) { router.push('/paths'); return }
    const pathData = await pathRes.json()
    const coursesData = await coursesRes.json()
    const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : []
    setPath({ ...pathData, courses: pathData.courses ?? [] })
    setAvailableCourses(Array.isArray(coursesData) ? coursesData : [])
    setPathEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchPath() }, [fetchPath])

  async function savePath(updates: Partial<LearningPath>) {
    if (!path) return
    setSaving(true); setSaved(false)
    await fetch(`/api/paths/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setPath((p) => p ? { ...p, ...updates } : p)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function togglePublish() {
    if (!path) return
    setPublishing(true)
    const newStatus = path.status === 'published' ? 'draft' : 'published'
    await savePath({ status: newStatus })
    setPublishing(false)
  }

  function addCourse(course: AvailableCourse) {
    if (!path) return
    if (path.courses.some((c) => c.course_id === course.id)) return
    const updated: PathCourse[] = [
      ...path.courses,
      { course_id: course.id, title: course.title, difficulty: course.difficulty, status: course.status, order_index: path.courses.length, is_mandatory: true },
    ]
    savePath({ courses: updated })
    setShowCoursePicker(false)
    setCourseSearch('')
  }

  function removeCourse(courseId: string) {
    if (!path) return
    const updated = path.courses
      .filter((c) => c.course_id !== courseId)
      .map((c, i) => ({ ...c, order_index: i }))
    savePath({ courses: updated })
  }

  function toggleMandatory(courseId: string) {
    if (!path) return
    const updated = path.courses.map((c) =>
      c.course_id === courseId ? { ...c, is_mandatory: !c.is_mandatory } : c
    )
    savePath({ courses: updated })
  }

  function moveUp(idx: number) {
    if (!path || idx === 0) return
    const arr = [...path.courses]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    savePath({ courses: arr.map((c, i) => ({ ...c, order_index: i })) })
  }

  function moveDown(idx: number) {
    if (!path || idx === path.courses.length - 1) return
    const arr = [...path.courses]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    savePath({ courses: arr.map((c, i) => ({ ...c, order_index: i })) })
  }

  async function openAssignModal() {
    setShowAssignModal(true)
    setSelectedUserIds(new Set())
    setAssignDueDate('')
    const res = await fetch('/api/org/learners')
    const data = await res.json()
    setLearners(Array.isArray(data) ? data : [])
  }

  function toggleLearner(learnerId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(learnerId)) next.delete(learnerId)
      else next.add(learnerId)
      return next
    })
  }

  async function submitAssign() {
    if (selectedUserIds.size === 0) return
    setAssigning(true)
    const res = await fetch(`/api/paths/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: Array.from(selectedUserIds), due_date: assignDueDate || undefined }),
    })
    setAssigning(false)
    if (!res.ok) return
    setShowAssignModal(false)
    fetchPath()
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
  if (!path) return null

  const isPublished = path.status === 'published'
  const filteredCourses = availableCourses.filter((c) =>
    !path.courses.some((pc) => pc.course_id === c.id) &&
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/paths" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />Paths
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>}
          {saving && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          <button onClick={togglePublish} disabled={publishing}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isPublished ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-green-600 hover:bg-green-500 text-white'
            )}>
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPublished ? <FileText className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

      {/* Path metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
            isPublished ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-300'
          )}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <input type="text" defaultValue={path.title}
          onBlur={(e) => { if (e.target.value !== path.title) savePath({ title: e.target.value }) }}
          className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-slate-600 border-b border-transparent focus:border-slate-700 pb-1 transition-colors"
          placeholder="Path title" />
        <textarea defaultValue={path.description ?? ''}
          onBlur={(e) => savePath({ description: e.target.value || null })}
          rows={2} placeholder="Describe this learning path..."
          className="w-full bg-transparent text-slate-400 text-sm focus:outline-none placeholder-slate-600 resize-none border-b border-transparent focus:border-slate-700 pb-1 transition-colors" />

        {/* Settings toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { key: 'is_adaptive', label: 'Adaptive', icon: Zap, color: 'violet', desc: 'AI personalises order', value: path.is_adaptive },
            { key: 'is_mandatory', label: 'Org mandatory', icon: Lock, color: 'amber', desc: 'Required for all learners', value: path.is_mandatory },
            { key: 'issues_certificate', label: 'Certificate', icon: Award, color: 'yellow', desc: 'Issued on completion', value: path.issues_certificate },
          ].map(({ key, label, icon: Icon, color, desc, value }) => (
            <button key={key} type="button"
              onClick={() => savePath({ [key]: !value } as Partial<LearningPath>)}
              className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                value
                  ? color === 'violet' ? 'bg-violet-950/40 border-violet-500/30' : color === 'amber' ? 'bg-amber-950/30 border-amber-500/30' : 'bg-yellow-950/30 border-yellow-500/30'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              )}>
              <Icon className={cn('w-4 h-4 shrink-0',
                value ? color === 'violet' ? 'text-violet-400' : color === 'amber' ? 'text-amber-400' : 'text-yellow-400' : 'text-slate-500'
              )} />
              <div>
                <p className="text-xs font-semibold text-slate-300">{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
              <div className={cn('ml-auto w-8 h-4.5 h-[18px] rounded-full flex items-center transition-all shrink-0 px-0.5',
                value ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
              )}>
                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
              </div>
            </button>
          ))}
        </div>

        {/* Adaptive note */}
        {path.is_adaptive && (
          <div className="bg-violet-950/20 border border-violet-500/20 rounded-lg p-3 text-xs text-violet-300 leading-relaxed">
            <span className="font-semibold">Adaptive mode on.</span> Sudar will reorder optional courses per learner based on their known concepts, struggles, goals, and pace. Mandatory courses always stay in their set position.
          </div>
        )}
      </div>

      {/* Course list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Courses <span className="text-slate-500 font-normal">({path.courses.length})</span>
          </h2>
          <button onClick={() => setShowCoursePicker(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            <Plus className="w-4 h-4" />Add course
          </button>
        </div>

        {path.courses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-500 text-sm">No courses yet — add some to build the path.</p>
            <button onClick={() => setShowCoursePicker(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all">
              <Plus className="w-3.5 h-3.5" />Add courses
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {path.courses.map((course, idx) => (
              <div key={course.course_id} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 text-slate-600 hover:text-slate-400 disabled:opacity-20">▲</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === path.courses.length - 1} className="p-0.5 text-slate-600 hover:text-slate-400 disabled:opacity-20">▼</button>
                </div>
                <GripVertical className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="text-xs font-medium text-slate-600 w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 line-clamp-1">{course.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {course.difficulty && <span className="text-[10px] text-slate-500 capitalize">{course.difficulty}</span>}
                    <span className={cn('text-[10px]', course.status === 'published' ? 'text-green-500' : 'text-slate-600')}>{course.status}</span>
                  </div>
                </div>
                <button onClick={() => toggleMandatory(course.course_id)}
                  title={course.is_mandatory ? 'Mandatory — click to make optional' : 'Optional — click to make mandatory'}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
                    course.is_mandatory ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500'
                  )}>
                  {course.is_mandatory ? <><Lock className="w-3 h-3" />Mandatory</> : <><Unlock className="w-3 h-3" />Optional</>}
                </button>
                <button onClick={() => removeCourse(course.course_id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mandatory / optional legend */}
        {path.courses.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-red-400" />Mandatory — learner must complete</span>
            <span className="flex items-center gap-1"><Unlock className="w-3 h-3 text-slate-500" />Optional — can be reordered by Sudar if adaptive</span>
          </div>
        )}
      </div>

      {/* Assigned learners */}
      {isPublished && path.courses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Assigned learners <span className="text-slate-500 font-normal">({pathEnrollments.length})</span>
            </h2>
            <button onClick={openAssignModal}
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              <UserPlus className="w-4 h-4" />Assign
            </button>
          </div>
          {pathEnrollments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl py-6 text-center text-slate-500 text-sm">
              No learners assigned yet. Click Assign to add learners to this path.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="px-4 py-3 font-medium">Learner</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Due date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pathEnrollments.map((e) => (
                    <tr key={e.id} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-3 text-slate-200">{e.full_name}</td>
                      <td className="px-4 py-3 text-slate-400">{Math.round(e.progress_pct)}%</td>
                      <td className="px-4 py-3 text-slate-400">{e.due_date ? new Date(e.due_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                          e.status === 'completed' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-400'
                        )}>{e.status === 'completed' ? 'Completed' : e.status === 'in_progress' ? 'In progress' : 'Not started'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Course picker modal */}
      {showCoursePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCoursePicker(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Add a course</h3>
              <button onClick={() => setShowCoursePicker(false)} className="text-slate-500 hover:text-slate-300 text-sm">Cancel</button>
            </div>
            <input type="text" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No available courses found</p>
              ) : filteredCourses.map((c) => (
                <button key={c.id} onClick={() => addCourse(c)}
                  className="w-full text-left px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 line-clamp-1">{c.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{c.difficulty ?? 'No difficulty set'} · {c.status}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAssignModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Assign path to learners</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-slate-300 text-sm">Cancel</button>
            </div>
            <p className="text-slate-400 text-xs">Select learners from your organisation. Optional: set a due date for all.</p>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Due date (optional)</label>
              <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Learners</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-2">
                {learners.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No learners in your org. Add members in Team first.</p>
                ) : learners.map((l) => (
                  <label key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" checked={selectedUserIds.has(l.id)} onChange={() => toggleLearner(l.id)}
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-200">{l.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={submitAssign} disabled={assigning || selectedUserIds.size === 0}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {assigning ? 'Assigning...' : `Assign to ${selectedUserIds.size} learner${selectedUserIds.size !== 1 ? 's' : ''}`}
              </button>
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
