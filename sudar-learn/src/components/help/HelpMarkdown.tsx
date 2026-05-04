import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function HelpMarkdown({ markdown }: { markdown: string }) {
  return (
    <div
      className="
      prose prose-sm max-w-none
      prose-headings:scroll-mt-24 prose-headings:text-card-foreground
      prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-card-foreground
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-muted prose-pre:border prose-pre:border-border
      prose-table:text-sm
    "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
