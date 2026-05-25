import ReactMarkdown from "react-markdown";

export function HelpMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="help-prose prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-foreground prose-code:bg-background-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-background-muted prose-pre:border prose-pre:border-card-border">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
