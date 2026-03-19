import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted animate-pulse",
        "before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.06),transparent)] before:bg-[length:200%_100%] before:animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
