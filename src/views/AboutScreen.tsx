import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowUpRightIcon } from "stera-icons";
import type { Route } from "@/App";
import { Button, buttonVariants } from "@/components/ui/button";
import { getTemplate } from "@/mock/api";
import { template as seed, type TemplateInfo } from "@/mock/template";

export function AboutScreen({ onNavigate }: { onNavigate: (r: Route) => void }) {
  // Seed synchronously so the static preview is never blank; refresh async after.
  const [info, setInfo] = useState<TemplateInfo>(seed);

  useEffect(() => {
    getTemplate().then(setInfo);
  }, []);

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("home")}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        <h1 className="st-body-lg-strong">About this template</h1>
      </header>
      <section className="flex-1 overflow-y-auto px-4 py-10">
        <article className="mx-auto flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="st-body-md-strong text-text-subtle">What this is</h2>
            <p className="st-heading-md">{info.summary}</p>
          </div>
          {info.body.map((paragraph) => (
            <p key={paragraph} className="st-body-lg text-text-subtle">
              {paragraph}
            </p>
          ))}
          <a
            href={info.repoUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ className: "self-start" })}
          >
            View on GitHub
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </article>
      </section>
    </main>
  );
}
