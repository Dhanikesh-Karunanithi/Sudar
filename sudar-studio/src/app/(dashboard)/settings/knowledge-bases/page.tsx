'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KnowledgeBaseManager } from '@/components/knowledge-base/KnowledgeBaseManager'

export default function KnowledgeBasesSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Knowledge bases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Org-wide reference libraries for Sudar tutor RAG — sales playbooks, policies, SOPs, and subject matter docs.
        </p>
      </div>

      <KnowledgeBaseManager />
    </div>
  )
}
