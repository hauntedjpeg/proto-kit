// Mock data. Deterministic, importable, synchronous — so the first paint of the
// Figma cached preview is never blank. In production this module is replaced by
// a real data source; the Message type survives.
export type Message = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  unread: boolean;
  receivedAt: string; // ISO; fixed strings, never Date.now()
};

export const messages: Message[] = [
  {
    id: "m1",
    from: "Priya Natarajan",
    subject: "Q4 roadmap review",
    preview: "Attaching the deck ahead of Thursday. Two open questions on the billing…",
    unread: true,
    receivedAt: "2026-10-27T09:12:00Z",
  },
  {
    id: "m2",
    from: "Design Systems",
    subject: "Icons v8.11 published",
    preview: "Duotone variants for the remaining 40 glyphs are in. Changelog inside.",
    unread: true,
    receivedAt: "2026-10-27T08:40:00Z",
  },
  {
    id: "m3",
    from: "Marcus Lee",
    subject: "Re: onboarding copy",
    preview: "Agreed on the shorter version. Shipping it in the next build.",
    unread: false,
    receivedAt: "2026-10-26T17:05:00Z",
  },
];
