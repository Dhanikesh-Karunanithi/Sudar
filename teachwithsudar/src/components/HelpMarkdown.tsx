import ReactMarkdown from "react-markdown";

export function HelpMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-a:text-primary prose-code:text-foreground-muted">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
