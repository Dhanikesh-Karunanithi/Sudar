import { Suspense } from "react";
import { InteractiveDemoClient } from "./InteractiveDemoClient";

export default function InteractivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <InteractiveDemoClient />
    </Suspense>
  );
}
