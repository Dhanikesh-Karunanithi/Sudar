import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function HelpMarkdown({ markdown }: { markdown: string }) {
  return (
    <div
      className="
      prose prose-invert prose-sm max-w-none
      prose-headings:scroll-mt-24 prose-headings:text-white
      prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white
      prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
      prose-code:text-indigo-200 prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
      prose-table:text-sm prose-th:text-slate-200 prose-td:text-slate-400
    "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
