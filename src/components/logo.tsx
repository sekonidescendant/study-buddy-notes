import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
        <PenLine className="size-4" />
      </span>
      <span className="text-lg">
        SIWES<span className="text-primary"> Writer</span>
      </span>
    </Link>
  );
}
