"use client";

import { HeroCinematic } from "@/components/home/HeroCinematic";
import { ProductTrinity } from "@/components/home/ProductTrinity";
import { IntelligenceConstellation } from "@/components/home/IntelligenceConstellation";
import { ModalitiesOrbit } from "@/components/home/ModalitiesOrbit";
import { TutorShowcase } from "@/components/home/TutorShowcase";
import { ImpactStrip } from "@/components/home/ImpactStrip";
import { AccessGate } from "@/components/home/AccessGate";

export default function HomePage() {
  return (
    <div className="w-full bg-[#050505]">
      <HeroCinematic />
      <ProductTrinity />
      <IntelligenceConstellation />
      <ModalitiesOrbit />
      <TutorShowcase />
      <ImpactStrip />
      <AccessGate />
    </div>
  );
}
