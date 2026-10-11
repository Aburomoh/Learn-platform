import { courses } from "@/content";
import { HomeNext, PageFrame } from "@/shell/r1";
import { ShareCard } from "@/shell/r1/ShareCard";

/** Home (R1 redesign): one clear way into learning, then the course list. */
export default function Home() {
  return (
    <PageFrame demo={courses.some((c) => c.authority === "DEMO")}>
      {/* the QR card is a server component (build-time SVG, #657), handed to the client page as a node */}
      <HomeNext courses={courses} share={<ShareCard />} />
    </PageFrame>
  );
}
