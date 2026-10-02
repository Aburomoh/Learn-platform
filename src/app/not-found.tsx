import Link from "next/link";
import { Shell } from "@/shell/Shell";

export default function NotFound() {
  return (
    <Shell>
      <h1>Not found</h1>
      <p>That page does not exist in this course companion.</p>
      <Link href="/">Back to courses</Link>
    </Shell>
  );
}
