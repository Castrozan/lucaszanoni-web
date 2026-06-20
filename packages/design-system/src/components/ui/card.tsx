import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({
  className,
  ...cardElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground",
        className,
      )}
      {...cardElementProps}
    />
  );
}

export function CardHeader({
  className,
  ...cardHeaderElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6", className)}
      {...cardHeaderElementProps}
    />
  );
}

export function CardTitle({
  className,
  ...cardTitleElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-none", className)}
      {...cardTitleElementProps}
    />
  );
}

export function CardDescription({
  className,
  ...cardDescriptionElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...cardDescriptionElementProps}
    />
  );
}

export function CardContent({
  className,
  ...cardContentElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...cardContentElementProps}
    />
  );
}

export function CardFooter({
  className,
  ...cardFooterElementProps
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6", className)}
      {...cardFooterElementProps}
    />
  );
}
