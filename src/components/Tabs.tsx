import type { KeyboardEvent, ReactNode } from "react";

export interface TabDefinition {
  id: string;
  label: string;
  panel: ReactNode;
}

export interface TabsProps {
  ariaLabel: string;
  tabs: readonly TabDefinition[];
  selectedId: string;
  onSelect(id: string): void;
}

function identifier(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function Tabs({ ariaLabel, onSelect, selectedId, tabs }: TabsProps) {
  const baseId = identifier(ariaLabel);
  const selectedTab = tabs.find((tab) => tab.id === selectedId);

  function tabId(tab: TabDefinition) {
    return `${baseId}-tab-${identifier(tab.id)}`;
  }

  function panelId(tab: TabDefinition) {
    return `${baseId}-panel-${identifier(tab.id)}`;
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const destination =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : null;

    if (destination === null) return;
    event.preventDefault();
    const nextTab = tabs[destination];
    if (nextTab === undefined) return;
    onSelect(nextTab.id);
    document.getElementById(tabId(nextTab))?.focus();
  }

  return (
    <div className="tabs">
      <div aria-label={ariaLabel} className="tabs__list" role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={panelId(tab)}
            aria-selected={tab.id === selectedId}
            className="tabs__tab"
            id={tabId(tab)}
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            role="tab"
            tabIndex={tab.id === selectedId ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {selectedTab ? (
        <div
          aria-labelledby={tabId(selectedTab)}
          className="tabs__panel"
          id={panelId(selectedTab)}
          role="tabpanel"
          tabIndex={0}
        >
          {selectedTab.panel}
        </div>
      ) : null}
    </div>
  );
}
