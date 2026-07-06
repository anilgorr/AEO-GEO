import Link from "next/link";
import type { Client } from "@/lib/types";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" />
    </svg>
  );
}

export function Sidebar({
  clients,
  activeClientId,
}: {
  clients: Client[];
  activeClientId?: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          T
        </div>
        <span className="text-sm font-semibold">Team Workspace</span>
      </div>

      <nav className="space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground"
        >
          <span className="size-4">
            <HomeIcon />
          </span>
          Dashboard
        </Link>
      </nav>

      <p className="mt-8 mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Clients
      </p>
      <nav className="space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            !activeClientId
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span className="size-4">
            <BuildingIcon />
          </span>
          All clients
        </Link>
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/?client=${client.id}`}
            className={`flex items-center gap-2.5 truncate rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeClientId === client.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="size-4">
              <BuildingIcon />
            </span>
            <span className="truncate">{client.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
