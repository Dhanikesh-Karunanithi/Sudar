"use client";

import { GatewayCta } from "@/components/gateway/GatewayCta";
import { GatewayHeadline } from "@/components/gateway/GatewayHeadline";

export function AccessGate() {
  return (
    <section className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[70vh]">
        <div className="flex flex-col justify-center items-center px-8 py-16 text-center border-b lg:border-b-0 lg:border-r border-[var(--border)]">
          <div className="max-w-md flex flex-col gap-6 items-center">
            <span className="text-xs font-medium uppercase tracking-wider text-brand-secondary">
              Learner portal
            </span>
            <GatewayHeadline as="h2" align="center">
              Sudar Learn
            </GatewayHeadline>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Enter your personal learning space—seven modalities, your AI tutor, and your cognitive twin.
            </p>
            <GatewayCta href="https://learn.thesudar.com/login">Enter learn space</GatewayCta>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center px-8 py-16 text-center">
          <div className="max-w-md flex flex-col gap-6 items-center">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--brand-accent)]">
              Creator portal
            </span>
            <GatewayHeadline as="h2" align="center">
              Sudar Studio
            </GatewayHeadline>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Create, manage, and distribute training. Generate courses from documents and manage learning paths.
            </p>
            <GatewayCta href="https://studio.thesudar.com/login">Enter studio space</GatewayCta>
          </div>
        </div>
      </div>
    </section>
  );
}
