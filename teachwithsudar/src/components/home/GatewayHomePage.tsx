"use client";

import { HeroCinematic } from "@/components/home/HeroCinematic";
import { ProductTrinity } from "@/components/home/ProductTrinity";
import { IntelligenceConstellation } from "@/components/home/IntelligenceConstellation";
import { TutorShowcase } from "@/components/home/TutorShowcase";
import { ImpactStrip } from "@/components/home/ImpactStrip";
import { AccessGate } from "@/components/home/AccessGate";

/** thesudar.com — application gateway into Learn / Studio. */
export function GatewayHomePage() {
  return (
    <div className="w-full bg-black">
      <HeroCinematic />
      <ProductTrinity />
      <IntelligenceConstellation />
      <TutorShowcase />
      <ImpactStrip />
      <AccessGate />
    </div>
  );
}
