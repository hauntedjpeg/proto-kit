import { useState } from "react";
import { ArrowLeftIcon } from "stera-icons";
import type { Route } from "../App";
import { Button } from "../components/Button";
import { storage } from "../lib/storage";

export function SettingsScreen({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const [compact, setCompact] = useState(() => storage.get("compact") === "1");

  function toggle() {
    const next = !compact;
    setCompact(next);
    storage.set("compact", next ? "1" : "0");
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <Button variant="ghost" icon={<ArrowLeftIcon className="size-4" />} onClick={() => onNavigate("inbox")}>
          Back
        </Button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>
      <section className="p-4">
        <label className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
          <span className="text-sm font-medium">Compact rows</span>
          <input type="checkbox" checked={compact} onChange={toggle} className="size-4" />
        </label>
      </section>
    </main>
  );
}
