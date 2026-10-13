import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "@/shell/r1/PageFrame";
import { PageHeading } from "@/shell/r1/PageHeading";
import { resolveMessage } from "@/tutor/messages";

export const metadata: Metadata = { title: "All courses" };

/**
 * `/courses/` (epic #670, owner refinement 2): no catalogue page of its own. The static export
 * cannot redirect on the server, so this page sends the browser on to Home's catalogue at once
 * (React hoists the meta refresh into <head>) and shows the link for anyone it does not move.
 */
export default function CoursesRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/#courses" />
      <PageFrame demo={false}>
        <PageHeading title={resolveMessage("ui.nav.all-courses")} route={resolveMessage("ui.nav.courses-moved")} />
        <p>
          <Link href="/#courses" className="btn btn-primary">
            {resolveMessage("ui.nav.go-courses")}
          </Link>
        </p>
      </PageFrame>
    </>
  );
}
