import { DemoShell } from "@/components/DemoShell";
import { EcosystemDemoPlayer } from "@/components/demo/EcosystemDemoPlayer";

type PageProps = {
  searchParams: Promise<{ chapter?: string }>;
};

export default async function InteractivePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const chapter = typeof params.chapter === "string" ? params.chapter : undefined;

  return (
    <DemoShell>
      <EcosystemDemoPlayer initialChapterId={chapter} autoPlay={false} />
    </DemoShell>
  );
}
