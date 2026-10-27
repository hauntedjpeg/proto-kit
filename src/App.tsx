// App = the prototype's "router". Keep it thin: it decides which screen shows and
// hands it data. In the Next.js conversion this file disappears — each case
// becomes an app/<route>/page.tsx.
import { useState } from "react";
import { InboxScreen } from "./screens/InboxScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export type Route = "inbox" | "settings";

export default function App() {
  const [route, setRoute] = useState<Route>("inbox");
  switch (route) {
    case "settings":
      return <SettingsScreen onNavigate={setRoute} />;
    default:
      return <InboxScreen onNavigate={setRoute} />;
  }
}
