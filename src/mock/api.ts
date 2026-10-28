// Fake async API. Promises + setTimeout stand in for route handlers / server
// fetches. In production, each function maps to a real fetch or a Server Action.
import { template, type TemplateInfo } from "@/mock/template";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getTemplate(): Promise<TemplateInfo> {
  await wait(150);
  return template;
}
