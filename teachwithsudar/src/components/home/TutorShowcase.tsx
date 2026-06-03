"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Message {
  id: number;
  sender: "user" | "tutor";
  text: string;
  isTyping?: boolean;
}

const conversation: Omit<Message, "id">[] = [
  {
    sender: "user",
    text: "I'm struggling to understand backpropagation in neural networks.",
  },
  {
    sender: "tutor",
    text: "Think of it like a team project. When the final score comes back, we trace the errors backwards to see exactly who made which mistake, so everyone can adjust their work for next time.",
  },
  {
    sender: "user",
    text: "Ah, that makes sense! Can we do a quick quiz on this?",
  },
  {
    sender: "tutor",
    text: "Absolutely! Let's start with a simple scenario: if our output error is high, which layer's weights do we adjust first?",
  },
];

export function TutorShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 60%",
      onEnter: () => startConversation(),
      once: true,
    });

    let activeTimeouts: NodeJS.Timeout[] = [];

    const startConversation = () => {
      let currentMsgIdx = 0;

      const addNextMessage = () => {
        if (currentMsgIdx >= conversation.length) return;

        const nextMsg = conversation[currentMsgIdx];

        // 1. Show Typing Indicator
        setMessages((prev) => [
          ...prev,
          {
            id: currentMsgIdx,
            sender: nextMsg.sender,
            text: "",
            isTyping: true,
          },
        ]);

        // Scroll chat window to bottom
        scrollToBottom();

        // 2. Wait, then stream text
        const typingDelay = nextMsg.sender === "user" ? 1000 : 2000;
        const t1 = setTimeout(() => {
          // Remove typing indicator and start streaming
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentMsgIdx
                ? { ...m, isTyping: false }
                : m
            )
          );

          let charIdx = 0;
          const streamInterval = setInterval(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentMsgIdx
                  ? { ...m, text: nextMsg.text.slice(0, charIdx + 1) }
                  : m
              )
            );
            scrollToBottom();
            charIdx += nextMsg.sender === "user" ? 3 : 2; // Speed of typing

            if (charIdx >= nextMsg.text.length) {
              clearInterval(streamInterval);
              currentMsgIdx++;
              // Delay before next message
              const nextDelay = nextMsg.sender === "user" ? 800 : 1500;
              const t2 = setTimeout(addNextMessage, nextDelay);
              activeTimeouts.push(t2);
            }
          }, 15);
        }, typingDelay);

        activeTimeouts.push(t1);
      };

      addNextMessage();
    };

    const scrollToBottom = () => {
      if (chatWindowRef.current) {
        gsap.to(chatWindowRef.current, {
          scrollTop: chatWindowRef.current.scrollHeight,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    return () => {
      trigger.kill();
      activeTimeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-10 py-24 md:py-36 bg-[#050505] border-t border-white/5 overflow-hidden"
    >
      <div className="max-w-content-wide mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left: Chat Showcase */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[560px] rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-md shadow-2xl overflow-hidden flex flex-col h-[480px]">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Tutor Mascot Avatar */}
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,69,0,0.2)]">
                  <span className="text-white font-mono text-xs font-bold">S</span>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm leading-none">Sudar</h3>
                  <span className="text-[10px] text-green-500 font-mono">Active Study Buddy</span>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-foreground-muted">
                Longitudinal Memory
              </div>
            </div>

            {/* Chat Body */}
            <div
              ref={chatWindowRef}
              className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground-muted/40 gap-2">
                  <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.01 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs font-mono tracking-widest uppercase">Initializing Tutor Session...</span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  {msg.sender === "tutor" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center border border-white/10 shrink-0 text-[10px] text-white font-bold">
                      S
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                      }`}
                    >
                      {msg.isTyping ? (
                        <div className="flex gap-1 items-center h-5 px-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center gap-3">
              <div className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 px-4 flex items-center text-xs text-foreground-muted/40 font-light">
                Ask Sudar anything about the course...
              </div>
              <button className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Copy */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 font-mono tracking-wider uppercase">
              Meet Sudar
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight leading-tight">
            Your cognitive <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 italic font-serif font-light">
              study buddy.
            </span>
          </h2>

          <p className="text-foreground-muted font-light leading-relaxed text-lg">
            Sudar is not just another chatbot. It is a patient, friendly, non-judgmental tutor that remembers your previous sessions, notices when you are struggling, and proactively offers help—without being asked.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-3 items-center text-white/80 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Reactive: Answers questions in context
            </div>
            <div className="flex gap-3 items-center text-white/80 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Proactive: Offers help when you stall or replay
            </div>
            <div className="flex gap-3 items-center text-white/80 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Longitudinal: Remembers context across sessions
            </div>
          </div>

          <div className="mt-4">
            <a
              href="https://learn.thesudar.com/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(255,69,0,0.2)]"
            >
              Start a Conversation
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
