// App = the prototype's "router". Keep it thin: it decides which screen shows and
// hands it data. In the Next.js conversion this file disappears — each case
// becomes an app/<route>/page.tsx.
import { useState } from "react";
import { AboutScreen } from "@/views/AboutScreen";
import { HomeScreen } from "@/views/HomeScreen";

export type Route = "home" | "about";

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  switch (route) {
    case "about":
      return <AboutScreen onNavigate={setRoute} />;
    default:
      return <HomeScreen onNavigate={setRoute} />;
  }
}
