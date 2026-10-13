import { courses } from "@/content";
// direct imports, not the shell barrel: a barrel on a page carries every client component it names
// into that page's bundle, MeetCard's figures and the boolean logic included (#675 size trim)
import { HomeNext } from "@/shell/r1/HomeNext";
import { PageFrame } from "@/shell/r1/PageFrame";
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
