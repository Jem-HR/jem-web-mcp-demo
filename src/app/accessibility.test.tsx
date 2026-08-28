import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import indexHtml from "../../index.html?raw";
import { Tabs, type TabDefinition } from "../components/Tabs";
import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import baseCss from "../styles/base.css?raw";
import componentsCss from "../styles/components.css?raw";
import featuresCss from "../styles/features.css?raw";
import tokensCss from "../styles/tokens.css?raw";
import demoProviderSource from "../demo/DemoProvider.tsx?raw";
import { App } from "./App";
import { AppShell } from "./AppShell";

function expectLogicalRouteOutline() {
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  const levels = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ).map((heading) => Number(heading.tagName.slice(1)));
  expect(levels[0]).toBe(1);
  levels.slice(1).forEach((level, index) => {
    expect(level).toBeLessThanOrEqual(levels[index]! + 1);
  });
}

function expectNamedControls(container: HTMLElement = document.body) {
  const controls = Array.from(
    container.querySelectorAll<HTMLElement>(
      "button, input, select, textarea, a[href]",
    ),
  );
  expect(controls.length).toBeGreaterThan(0);
  controls.forEach((control) => expect(control).not.toHaveAccessibleName(""));
}

function normalise(css: string): string {
  return css.replace(/\s+/g, " ");
}

function token(name: string): string {
  const value = tokensCss.match(
    new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"),
  )?.[1];
  if (value === undefined) throw new Error(`Missing ${name}.`);
  return value;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("application accessibility", () => {
  it("keeps one main, one h1, and a logical heading progression on every experience surface", () => {
    render(<App />);

    for (const tab of ["Overview", "Shifts", "Learn", "Rewards"]) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expectLogicalRouteOutline();
    }

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));
    for (const tab of [
      "Dashboard",
      "Create Opportunity",
      "Manage Shifts",
      "Fairness & Data",
    ]) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expectLogicalRouteOutline();
    }
  });

  it("keeps onboarding routes to one main and h1 with labelled controls", () => {
    const initial = createInitialDemoState();
    for (const step of [1, 2, 3, 4] as const) {
      const view = render(
        <DemoProvider
          store={createDemoStore({
            ...initial,
            onboarding: { completed: false, step },
          })}
        >
          <AppShell />
        </DemoProvider>,
      );
      expectLogicalRouteOutline();
      expectNamedControls();
      view.unmount();
    }
  });

  it("labels every editable control in employee and employer workflows", () => {
    const employee = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Edit goal and expenses" }),
    );
    expectNamedControls(screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
    expectNamedControls(screen.getByRole("dialog"));
    employee.unmount();

    const rewards = render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Allocate August Safety Award" }),
    );
    expectNamedControls(screen.getByRole("dialog"));
    rewards.unmount();

    const employerState = createInitialDemoState();
    render(
      <DemoProvider
        store={createDemoStore({ ...employerState, mode: "employer" })}
      >
        <AppShell />
      </DemoProvider>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Create Opportunity" }));
    expectNamedControls(screen.getByRole("tabpanel"));
  });

  it("provides named activity, non-colour status text, descriptive actions, and one valued progress name", () => {
    render(<App />);

    expect(
      screen.getByRole("status", { name: "Latest activity" }),
    ).toBeInTheDocument();
    expect(screen.getByText("WebMCP is unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: "Savings progress: 42%" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expectNamedControls();
    expect(
      screen.getByRole("button", { name: "Edit goal and expenses" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "View shift" })).toBeEnabled();
  });

  it("gives duplicate same-labelled tabsets unique, complete ID references", () => {
    const tabs: TabDefinition[] = [
      { id: "overview", label: "Overview", panel: <p>First panel</p> },
      { id: "shifts", label: "Shifts", panel: <p>Second panel</p> },
    ];

    function Harness() {
      const [first, setFirst] = useState("overview");
      const [second, setSecond] = useState("overview");
      return (
        <>
          <Tabs
            ariaLabel="Repeated tabs"
            onSelect={setFirst}
            selectedId={first}
            tabs={tabs}
          />
          <Tabs
            ariaLabel="Repeated tabs"
            onSelect={setSecond}
            selectedId={second}
            tabs={tabs}
          />
        </>
      );
    }

    render(<Harness />);
    const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]")).map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);

    screen.getAllByRole("tablist").forEach((tablist) => {
      const tabsInList = within(tablist).getAllByRole("tab");
      expect(tabsInList.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
      tabsInList.forEach((tab) => {
        const panelId = tab.getAttribute("aria-controls");
        expect(panelId).not.toBeNull();
        expect(document.getElementById(panelId!)).not.toBeNull();
      });
    });
    screen.getAllByRole("tabpanel").forEach((panel) => {
      expect(
        document.getElementById(panel.getAttribute("aria-labelledby")!),
      ).not.toBeNull();
    });
  });

  it("moves dialog focus, traps Tab, closes with Escape, and restores the trigger", () => {
    render(<App />);
    const trigger = screen.getByRole("button", {
      name: "Edit goal and expenses",
    });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Edit my details" });
    const close = within(dialog).getByRole("button", { name: "Close dialog" });
    expect(close).toHaveFocus();
    const last = within(dialog).getByRole("button", { name: "Save changes" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps critical production colour pairings at WCAG AA contrast", () => {
    const pairs = [
      ["primary", token("--jem-navy"), token("--jem-pink")],
      ["body", token("--jem-navy"), token("--jem-cream")],
      ["muted", token("--jem-muted"), token("--jem-cream")],
      ["success", token("--jem-success"), "#dff4e9"],
      ["warning", token("--jem-warning"), "#fff0d6"],
      ["danger", token("--jem-danger"), "#fde5e8"],
      ["info", "#a83b50", token("--jem-pink-light")],
    ] as const;

    pairs.forEach(([name, foreground, background]) => {
      expect(
        contrastRatio(foreground, background),
        name,
      ).toBeGreaterThanOrEqual(4.5);
    });
    expect(normalise(componentsCss)).toMatch(
      /\.button--primary \{[^}]*background: var\(--jem-pink\);[^}]*color: var\(--jem-navy\);/,
    );
    expect(normalise(featuresCss)).toMatch(
      /\.jem-mark \{[^}]*background: var\(--jem-pink\);[^}]*color: var\(--jem-navy\);/,
    );
  });

  it("protects focus, touch, responsive, dialog, and reduced-motion CSS contracts", () => {
    const allCss = normalise(`${baseCss}\n${componentsCss}\n${featuresCss}`);
    expect(allCss).toMatch(/input:focus-visible/);
    expect(allCss).toMatch(/select:focus-visible/);
    expect(allCss).toMatch(/textarea:focus-visible/);
    expect(allCss).toMatch(/outline: 2px solid var\(--jem-white\)/);
    expect(normalise(tokensCss)).toMatch(
      /--focus-ring: 0 0 0 4px var\(--jem-navy\)/,
    );
    expect(allCss).toMatch(/min-(?:block-size|height): 44px/);
    expect(allCss).toMatch(
      /\.dialog__close \{[^}]*min-(?:block-size|height): 44px/,
    );
    expect(allCss).toMatch(
      /\.reward-destinations label \{[^}]*min-(?:block-size|height): 44px/,
    );
    expect(allCss).toMatch(/body \{[^}]*min-width: 320px/);
    expect(allCss).toMatch(
      /\.tabs__tab:focus-visible \{[^}]*scroll-margin-inline/,
    );
    expect(allCss).toMatch(/\.dialog__content \{[^}]*overflow-y: auto/);

    const responsiveStart = allCss.indexOf("@media (max-width: 47.5rem)");
    const nextMedia = allCss.indexOf("@media", responsiveStart + 1);
    const responsive = allCss.slice(
      responsiveStart,
      nextMedia === -1 ? undefined : nextMedia,
    );
    expect(responsiveStart).toBeGreaterThanOrEqual(0);
    expect(responsive).toMatch(/\.app-header \{[^}]*flex-wrap: wrap/);
    expect(responsive).toMatch(
      /\.feature-form__fields--two-columns \{[^}]*grid-template-columns: 1fr/,
    );
    expect(responsive).toMatch(
      /\.employee-summary-grid,[^{]*\{[^}]*grid-template-columns: 1fr/,
    );
    expect(responsive).toMatch(/\.tabs__list[^{]*\{[^}]*overflow-x: auto/);
    expect(responsive).toMatch(/\.tabs__tab[^{]*\{[^}]*flex: 0 0 auto/);
    expect(responsive).toMatch(
      /\.dialog--viewport-constrained \{[^}]*max-height: calc\(100dvh - 2rem\)/,
    );

    const reducedStart = allCss.indexOf(
      "@media (prefers-reduced-motion: reduce)",
    );
    const reduced = allCss.slice(reducedStart);
    expect(reducedStart).toBeGreaterThanOrEqual(0);
    expect(reduced).toMatch(/\*, \*::before, \*::after \{/);
    expect(reduced).toMatch(/scroll-behavior: auto !important/);
    expect(reduced).toMatch(/animation-duration: 0\.01ms !important/);
    expect(reduced).toMatch(/animation-iteration-count: 1 !important/);
    expect(reduced).toMatch(/transition-duration: 0\.01ms !important/);
  });

  it("keeps scalable English metadata descriptive of Jem Unlocked", () => {
    const html = normalise(indexHtml);
    expect(html).toContain('<html lang="en">');
    expect(html).toMatch(
      /name="viewport" content="width=device-width, initial-scale=1\.0"/,
    );
    expect(html).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i);
    expect(html).toMatch(/<title>Jem Unlocked[^<]*<\/title>/);
    expect(html).toMatch(/name="description" content="[^"]*Jem Unlocked[^"]*"/);
    expect(demoProviderSource).not.toMatch(/\bwindow\b|globalThis/);
  });
});
