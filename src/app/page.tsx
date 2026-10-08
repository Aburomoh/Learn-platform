import { courses, outlines } from "@/content";
import { HomeNext, PageFrame } from "@/shell/r1";

/** Home (R1 redesign): one clear way into learning, then the course list. */
export default function Home() {
  return (
    <PageFrame demo={courses.some((c) => c.authority === "DEMO")}>
      <HomeNext courses={courses} outlines={outlines} />
    </PageFrame>
  );
}
