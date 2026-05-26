"use client";

import { DemoShell } from "@/components/DemoShell";
import { EcosystemDemoPlayer } from "@/components/demo/EcosystemDemoPlayer";
import { useSearchParams } from "next/navigation";

export function InteractiveDemoClient() {
  const searchParams = useSearchParams();
  const chapter = searchParams.get("chapter") ?? undefined;

  return (
    <DemoShell>
      <EcosystemDemoPlayer initialChapterId={chapter} autoPlay={false} />
    </DemoShell>
  );
}
