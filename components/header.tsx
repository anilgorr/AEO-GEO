import { signOut } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header({
  fullName,
  role,
}: {
  fullName: string;
  role: string;
}) {
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div>
        <p className="text-lg font-semibold tracking-tight">
          Welcome back, {fullName.split(" ")[0]}
        </p>
        <p className="text-sm text-muted-foreground capitalize">
          {role.replace("_", " ")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-accent text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit" className="rounded-full">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
