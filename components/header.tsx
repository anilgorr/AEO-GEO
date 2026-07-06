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
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">SEO / AEO / GEO Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Create, assign, and track team progress
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <p className="font-medium">{fullName}</p>
          <p className="text-muted-foreground capitalize">
            {role.replace("_", " ")}
          </p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
