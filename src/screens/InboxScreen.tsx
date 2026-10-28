// Screen = one route's worth of UI. Owns local state and calls the mock API.
// In Next.js this becomes app/inbox/page.tsx (server) + this file as the
// 'use client' body that receives initial data via props.
import { useEffect, useState } from "react";
import { SettingsIcon } from "stera-icons";
import type { Route } from "@/App";
import { Button } from "@/components/Button";
import { MessageRow } from "@/components/MessageRow";
import { listMessages, markRead } from "@/mock/api";
import { messages as seed, type Message } from "@/mock/messages";

export function InboxScreen({ onNavigate }: { onNavigate: (r: Route) => void }) {
  // Seed synchronously so the static preview is never blank; refresh async after.
  const [items, setItems] = useState<Message[]>(seed);

  useEffect(() => {
    listMessages().then(setItems);
  }, []);

  async function open(id: string) {
    await markRead(id);
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  }

  const unread = items.filter((m) => m.unread).length;

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-semibold">
          Inbox {unread > 0 && <span className="ml-1 text-sm text-neutral-500">({unread})</span>}
        </h1>
        <Button variant="ghost" icon={<SettingsIcon className="size-4" />} onClick={() => onNavigate("settings")}>
          Settings
        </Button>
      </header>
      <section className="flex-1 overflow-y-auto">
        {items.map((m) => (
          <MessageRow key={m.id} message={m} onOpen={open} />
        ))}
      </section>
    </main>
  );
}
