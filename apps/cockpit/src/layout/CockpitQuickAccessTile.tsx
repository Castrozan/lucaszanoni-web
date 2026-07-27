import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { CockpitQuickAccessBookmark } from "./cockpit-quick-access-bookmarks";

const tileClassName =
  "block rounded-lg border border-border bg-surface px-5 py-4 text-inherit no-underline transition-colors hover:border-primary";

export interface CockpitQuickAccessTileProps {
  readonly bookmark: CockpitQuickAccessBookmark;
}

export function CockpitQuickAccessTile({
  bookmark,
}: CockpitQuickAccessTileProps) {
  const body = (
    <>
      <div className="text-[1.05rem] font-semibold text-primary">
        {bookmark.label}
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground">
        {bookmark.description}
      </div>
    </>
  );
  return wrapInTargetLink(bookmark, body);
}

function wrapInTargetLink(
  bookmark: CockpitQuickAccessBookmark,
  body: ReactNode,
) {
  if (bookmark.target.kind === "cockpit-route") {
    return (
      <Link to={bookmark.target.path} className={tileClassName}>
        {body}
      </Link>
    );
  }
  if (bookmark.target.kind === "new-tab-url") {
    return (
      <a
        href={bookmark.target.href}
        target="_blank"
        rel="noreferrer"
        className={tileClassName}
      >
        {body}
      </a>
    );
  }
  return (
    <a href={bookmark.target.href} className={tileClassName}>
      {body}
    </a>
  );
}
