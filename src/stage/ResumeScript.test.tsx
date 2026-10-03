import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ResumeScript } from "./ResumeScript";
import { resumeMarkerScript } from "./resumeMarker";

describe("<ResumeScript> (#189)", () => {
  it("is in the pre-rendered HTML, where the browser runs it before the stage paints", () => {
    const html = renderToString(<ResumeScript offeringId="ecet111.2026-fall" activityId="decimal-to-binary" />);
    expect(html.startsWith("<script>")).toBe(true);
    expect(html).toContain("decimal-to-binary");
    expect(resumeMarkerScript("ecet111.2026-fall", "decimal-to-binary")).toContain("localStorage.getItem");
  });

  it("renders no script tag on a client-side navigation, so React logs no error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<ResumeScript offeringId="ecet111.2026-fall" activityId="decimal-to-binary" />);
    expect(container.querySelector("script")).toBeNull();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
