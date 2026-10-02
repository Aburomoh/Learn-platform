import type { Metadata } from "next";
import { Shell } from "@/shell/Shell";
import { SettingsForm } from "@/shell/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Shell crumbs={[{ href: "/settings/", label: "Settings" }]}>
      <h1>Settings</h1>
      <SettingsForm />
    </Shell>
  );
}
