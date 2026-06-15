import { redirect } from "next/navigation";

/** Legacy URL — Sudar Store replaced Plugin Downloads. */
export default function PluginsPage() {
  redirect("/store");
}
