// Web storage can throw inside embedded/sandboxed contexts (Figma's canvas, previews).
// Always go through this wrapper; it degrades to memory.
const mem = new Map<string, string>();

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return mem.get(key) ?? null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      mem.set(key, value);
    }
  },
};
