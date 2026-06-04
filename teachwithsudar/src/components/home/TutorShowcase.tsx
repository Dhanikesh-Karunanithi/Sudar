"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GatewayCta } from "@/components/gateway/GatewayCta";
import { GatewayHeadline } from "@/components/gateway/GatewayHeadline";
import { GatewaySection } from "@/components/gateway/GatewaySection";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";

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
    text: "Think of it like a team project. When the final score comes back, we trace errors backwards so everyone can adjust for next time.",
  },
  {
    sender: "user",
    text: "That makes sense. Can we do a quick quiz on this?",
  },
  {
    sender: "tutor",
    text: "Absolutely. If our output error is high, which layer's weights do we adjust first?",
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

    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

    const scrollToBottom = () => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
      }
    };

    const startConversation = () => {
      let currentMsgIdx = 0;

      const addNextMessage = () => {
        if (currentMsgIdx >= conversation.length) return;

        const nextMsg = conversation[currentMsgIdx];

        setMessages((prev) => [
          ...prev,
          { id: currentMsgIdx, sender: nextMsg.sender, text: "", isTyping: true },
        ]);
        scrollToBottom();

        const typingDelay = nextMsg.sender === "user" ? 800 : 1400;
        const t1 = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === currentMsgIdx ? { ...m, isTyping: false } : m))
          );

          let charIdx = 0;
          const streamInterval = setInterval(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentMsgIdx ? { ...m, text: nextMsg.text.slice(0, charIdx + 1) } : m
              )
            );
            scrollToBottom();
            charIdx += nextMsg.sender === "user" ? 3 : 2;

            if (charIdx >= nextMsg.text.length) {
              clearInterval(streamInterval);
              currentMsgIdx++;
              const t2 = setTimeout(addNextMessage, nextMsg.sender === "user" ? 600 : 1200);
              activeTimeouts.push(t2);
            }
          }, 15);
        }, typingDelay);

        activeTimeouts.push(t1);
      };

      addNextMessage();
    };

    return () => {
      trigger.kill();
      activeTimeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <GatewaySection id="tutor">
      <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7">
          <div className="w-full max-w-[560px] mx-auto lg:mx-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden flex flex-col h-[420px]">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SudarLogoMark size={36} variant="on-dark" />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Sudar</h3>
                  <span className="text-[10px] text-brand-secondary font-medium">Active study buddy</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                Longitudinal memory
              </span>
            </div>

            <div
              ref={chatWindowRef}
              className="flex-1 p-5 overflow-y-auto flex flex-col gap-3"
            >
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]/50 text-xs uppercase tracking-wider">
                  Initializing tutor session…
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex max-w-[88%] ${msg.sender === "user" ? "self-end" : "self-start"}`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[var(--brand-accent)] text-white rounded-br-md"
                        : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
                    }`}
                  >
                    {msg.isTyping ? (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border)]">
              <div className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 flex items-center text-xs text-[var(--text-secondary)]">
                Ask Sudar anything about the course…
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <GatewayHeadline badge="Meet Sudar" accent="study buddy." accentStyle="word" accentOnNewLine>
            Your cognitive
          </GatewayHeadline>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Sudar is a patient, non-judgmental tutor that remembers prior sessions, notices when you struggle,
            and offers help—without being asked.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-[var(--text-primary)]">
            <li className="flex gap-2">
              <span className="text-[var(--brand-accent)]">·</span> Reactive: answers in course context
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand-accent)]">·</span> Proactive: help when you stall or replay
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand-accent)]">·</span> Longitudinal: memory across sessions
            </li>
          </ul>
          <GatewayCta href="https://learn.thesudar.com/login" className="w-fit">
            Start a conversation
          </GatewayCta>
        </div>
      </div>
    </GatewaySection>
  );
}
