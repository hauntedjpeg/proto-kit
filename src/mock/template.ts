// Mock data. Deterministic, importable, synchronous — so the first paint of the
// Figma cached preview is never blank. In production this module is replaced by
// a real data source; the TemplateInfo type survives.
export type TemplateInfo = {
  name: string;
  summary: string;
  body: string[];
  repoUrl: string;
};

export const template: TemplateInfo = {
  name: "proto-kit",
  summary: "A starting point for interactive prototypes that live in Figma.",
  body: [
    "proto-kit is a template for building prototypes that look and behave like a real product. It runs inside Figma as a code layer, so you can click through it right on the canvas next to your designs.",
    "You don't need to write code to use it. Describe what you want to Figma's agent — a screen, a flow, a component — and it builds it here using the same components, icons, and type styles as the design system.",
    "Everything runs on sample data, so you can explore ideas freely. When a prototype is approved, engineers can turn it into the real app without starting over.",
  ],
  repoUrl: "https://github.com/hauntedjpeg/proto-kit",
};
