"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function AccordionItem({ id, title, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-trigger-${id}`}
      >
        <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight sm:text-xl">
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-primary shrink-0 ml-4"
          aria-hidden
        >
          <ChevronDownIcon className="shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${id}`}
            role="region"
            aria-labelledby={`accordion-trigger-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pb-6 pl-0 pr-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0">{children}</div>;
}
