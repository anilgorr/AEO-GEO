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

function NavIconBadge({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
        active
          ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span className="size-4">{children}</span>
    </span>
  );
}

function NavItem({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-card text-foreground shadow-md"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
      }`}
    >
      <NavIconBadge active={active}>{icon}</NavIconBadge>
      <span className="truncate">{children}</span>
    </Link>
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
    <aside className="hidden w-64 shrink-0 flex-col bg-muted/40 px-3 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-semibold text-white shadow-sm">
          T
        </div>
        <span className="text-sm font-semibold">Team Workspace</span>
      </div>

      <nav className="space-y-1">
        <NavItem href="/" active icon={<HomeIcon />}>
          Dashboard
        </NavItem>
      </nav>

      <p className="mt-8 mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Clients
      </p>
      <nav className="space-y-1">
        <NavItem href="/" active={!activeClientId} icon={<BuildingIcon />}>
          All clients
        </NavItem>
        {clients.map((client) => (
          <NavItem
            key={client.id}
            href={`/?client=${client.id}`}
            active={activeClientId === client.id}
            icon={<BuildingIcon />}
          >
            {client.name}
          </NavItem>
        ))}
      </nav>
    </aside>
  );
}
