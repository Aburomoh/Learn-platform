import { courses } from "@/content";
import { PageFrame, PageHeading, PrimaryAction } from "@/shell/r1";

export default function NotFound() {
  return (
    <PageFrame demo={courses.some((c) => c.authority === "DEMO")}>
      <PageHeading title="Not found" route="That page does not exist in this course companion." />
      <PrimaryAction primary={{ label: "Back to home", href: "/" }} />
    </PageFrame>
  );
}
