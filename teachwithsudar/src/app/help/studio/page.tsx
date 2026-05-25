import { HelpHubShell } from "@/components/platform/HelpHubShell";

export const metadata = {
  title: "Sudar Studio Help",
  description: "Public help guides for Sudar Studio: authoring, integrations, AI, and governance.",
};

export default function StudioHelpPage() {
  return <HelpHubShell activeTab="studio" />;
}
