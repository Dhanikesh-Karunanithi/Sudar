import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Story",
};

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
