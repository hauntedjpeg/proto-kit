// Screen = one route's worth of UI. Owns local state and calls the mock API.
// In Next.js this becomes app/page.tsx. Replace the empty state with your first screen.
import { BookOpenIcon, SparklesIcon } from "stera-icons";
import type { Route } from "@/App";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function HomeScreen({ onNavigate }: { onNavigate: (r: Route) => void }) {
  return (
    <main className="flex h-dvh flex-col p-4">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SparklesIcon />
          </EmptyMedia>
          <EmptyTitle>Start your prototype</EmptyTitle>
          <EmptyDescription>
            This screen is a blank canvas. Ask Figma's agent to build your first screen, or read about what this
            template is.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => onNavigate("about")}>
            <BookOpenIcon data-icon="inline-start" />
            About this template
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
