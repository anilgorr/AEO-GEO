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

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V9M12 19V5M20 19v-6" />
      <path d="M2 19h20" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
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
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="size-4 shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function Sidebar({
  clients,
  activeClientId,
  activePage = "dashboard",
  newTaskTrigger,
}: {
  clients: Client[];
  activeClientId?: string;
  activePage?: "dashboard" | "monitoring" | "agents";
  newTaskTrigger: React.ReactNode;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-3 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white">
          T
        </div>
        <span className="text-base font-bold tracking-tight">
          Team Workspace
        </span>
      </div>

      <nav className="space-y-1">
        <NavItem href="/" active={activePage === "dashboard"} icon={<HomeIcon />}>
          Dashboard
        </NavItem>
        <NavItem
          href="/monitoring"
          active={activePage === "monitoring"}
          icon={<ChartIcon />}
        >
          Monitoring
        </NavItem>
        <NavItem
          href="/agents"
          active={activePage === "agents"}
          icon={<SparkleIcon />}
        >
          Agents
        </NavItem>
      </nav>

      <p className="mt-8 mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Clients
      </p>
      <nav className="flex-1 space-y-1">
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

      {newTaskTrigger}
    </aside>
  );
}
