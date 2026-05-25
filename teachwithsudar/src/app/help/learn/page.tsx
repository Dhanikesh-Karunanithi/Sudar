import { HelpHubShell } from "@/components/platform/HelpHubShell";

export const metadata = {
  title: "Sudar Learn Help",
  description: "Public help guides for Sudar Learn: modalities, tutor, paths, and more.",
};

export default function LearnHelpPage() {
  return <HelpHubShell activeTab="learn" />;
}
