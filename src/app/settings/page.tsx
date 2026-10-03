import type { Metadata } from "next";
import { courses } from "@/content";
import { PageFrame, PageHeading } from "@/shell/r1";
import { SettingsForm } from "@/shell/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageFrame demo={courses.some((c) => c.authority === "DEMO")}>
      <PageHeading title="Settings" />
      <SettingsForm />
    </PageFrame>
  );
}
