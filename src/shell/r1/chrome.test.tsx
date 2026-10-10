import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { product } from "../../../config/product";
import { TutorCard, monogram } from "@/tutor/ui";
import { Footer, ProfileMenu, TopBar, TopicRow } from "./index";

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("TopBar", () => {
  it("shows the mark and the name from config, linked to home, and the profile button", () => {
    render(<TopBar />);
    const home = screen.getByRole("link", { name: `${product.name} home` });
    expect(home).toHaveTextContent(product.name);
    expect(home.querySelector("img")).toHaveAttribute("src", product.brand.markSrc);
    expect(home.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByRole("button", { name: "Profile and settings" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull(); // no breadcrumb trail
  });

  it("can show one quiet back link", () => {
    render(<TopBar back={{ label: "Number-base conversions", href: "/courses/ecet111/number-systems/" }} />);
    expect(screen.getByRole("link", { name: "Number-base conversions" })).toBeInTheDocument();
  });
});

describe("ProfileMenu", () => {
  it("opens and closes as a disclosure; Escape returns focus to the button", async () => {
    render(<ProfileMenu />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Profile and settings" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/You are a guest/)).toBeNull();

    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(button.getAttribute("aria-controls")!)).toHaveTextContent("Your progress stays in this browser");
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();

    await user.tab();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes on a click outside", async () => {
    render(
      <>
        <ProfileMenu />
        <p>elsewhere</p>
      </>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Profile and settings" }));
    await user.click(screen.getByText("elsewhere"));
    expect(screen.getByRole("button", { name: "Profile and settings" })).toHaveAttribute("aria-expanded", "false");
  });

  it("offers Light, Dark and Match device, light by default, and applies the choice at once", async () => {
    render(<ProfileMenu />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Profile and settings" }));
    const select = screen.getByLabelText("Appearance");
    expect(select).toHaveValue("light");
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["Light", "Dark", "Match device"]);
    await user.selectOptions(select, "dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    await user.selectOptions(select, "light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("Footer", () => {
  it("shows the facts line, with the demo notice only for demo content", () => {
    const { rerender } = render(<Footer demo />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Demo content");
    expect(screen.getByText("Optional practice, not graded")).toBeInTheDocument();
    expect(screen.getByText("Progress stays in this browser")).toBeInTheDocument();
    rerender(<Footer demo={false} />);
    expect(screen.queryByText("Demo content")).toBeNull();
  });
});

describe("TopicRow", () => {
  it("is a plain row whose only target is its one action", () => {
    render(
      <ol>
        <TopicRow title="Logic gates" route="NOT, AND, OR, one gate at a time" status="3 short challenges · about 6 min" action={{ label: "Start", href: "/courses/ecet111/logic-gates/" }} />
      </ol>,
    );
    const row = screen.getByRole("listitem");
    expect(within(row).getByRole("heading", { level: 3 })).toHaveTextContent("Logic gates");
    expect(within(row).getAllByRole("link")).toHaveLength(1);
    expect(row.querySelector("[data-primary-action]")).toBeNull(); // quiet by default
    expect(row).not.toHaveAttribute("onclick");
  });

  it("gives the next topic the filled button, and a finished topic a check with its text", () => {
    render(
      <ol>
        <TopicRow title="Conversions" status="2 of 4 challenges done" action={{ label: "Continue", href: "/a/" }} emphasis="primary" />
        <TopicRow title="Gates" status="Completed" completed action={{ label: "Review", href: "/b/?review=1" }} />
      </ol>,
    );
    const [next, done] = screen.getAllByRole("listitem");
    expect(next.querySelector("[data-primary-action]")).toHaveTextContent("Continue");
    expect(within(done).getByText("Completed").querySelector("svg")).not.toBeNull();
  });
});

describe("TutorCard", () => {
  it("builds the monogram from the name", () => {
    expect(monogram("Mr. Mohanad")).toBe("MM");
    expect(monogram("Ada")).toBe("A");
    expect(monogram("Mr. Mohanad Abu-Romoh")).toBe("MM");
  });

  it("shows the monogram disc, the name and the line it is given", () => {
    render(<TutorCard name="Mr. Mohanad" message="We'll do this one step at a time." />);
    const card = screen.getByRole("complementary", { name: "Tutor" });
    expect(card.querySelector("[data-monogram]")).toHaveTextContent("DM");
    expect(card).toHaveTextContent("Mr. Mohanad");
    expect(card).toHaveTextContent("We'll do this one step at a time.");
    expect(card.querySelector("img")).toBeNull();
  });

  it("uses the pose art from config when it exists, and never invents a message", () => {
    render(<TutorCard name="Mr. Mohanad" size="lg" portrait={product.brand.tutorPortrait} />);
    const card = screen.getByRole("complementary", { name: "Tutor" });
    // the waist-up pose from 900 px (rails, home card), the head crop below
    expect(card.querySelector("source")).toHaveAttribute("media", "(min-width: 900px)");
    expect(card.querySelector("source")).toHaveAttribute("srcset", "/tutor/neutral-waist.webp");
    expect(card.querySelector("img")).toHaveAttribute("src", "/tutor/neutral.webp");
    expect(card.querySelector("[data-monogram]")).toBeNull();
    expect(card.querySelectorAll("p")).toHaveLength(1); // the name only
  });

  it("shows the welcome pose when asked, and fetches nothing while the pose is unknown", () => {
    const { rerender } = render(<TutorCard name="Mr. Mohanad" portrait={product.brand.tutorPortrait} pose={null} />);
    expect(document.querySelector("img, source")).toBeNull();
    rerender(<TutorCard name="Mr. Mohanad" portrait={product.brand.tutorPortrait} pose="welcome" />);
    expect(document.querySelector("img")).toHaveAttribute("src", "/tutor/welcome.webp");
    expect(document.querySelector("source")).toHaveAttribute("srcset", "/tutor/welcome-waist.webp");
  });
});
