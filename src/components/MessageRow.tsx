import { MailIcon, MailOpenIcon } from "stera-icons";
import type { Message } from "../mock/messages";

type Props = { message: Message; onOpen: (id: string) => void };

export function MessageRow({ message, onOpen }: Props) {
  const Icon = message.unread ? MailIcon : MailOpenIcon;
  return (
    <button
      type="button"
      onClick={() => onOpen(message.id)}
      className="flex w-full items-start gap-3 border-b border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${message.unread ? "text-neutral-900" : "text-neutral-400"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate ${message.unread ? "font-semibold" : "font-medium text-neutral-700"}`}>
            {message.from}
          </span>
          <time className="shrink-0 text-xs text-neutral-500">
            {new Date(message.receivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </time>
        </div>
        <div className="truncate text-sm">{message.subject}</div>
        <div className="truncate text-sm text-neutral-500">{message.preview}</div>
      </div>
    </button>
  );
}
