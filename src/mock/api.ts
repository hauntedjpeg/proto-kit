// Fake async API. Promises + setTimeout stand in for route handlers / server
// fetches. In production, each function maps to a real fetch or a Server Action.
import { messages, type Message } from "@/mock/messages";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listMessages(): Promise<Message[]> {
  await wait(300);
  return messages;
}

export async function markRead(id: string): Promise<void> {
  await wait(150);
  const m = messages.find((x) => x.id === id);
  if (m) m.unread = false;
}
