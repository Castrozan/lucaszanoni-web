import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BottomStatusBar, Button } from "@platform/design-system";
import { LandingHeader } from "../../landing/LandingHeader";
import { NotFoundScene } from "./NotFoundScene";
import "./not-found.css";

export function NotFoundPage() {
  const headingReference = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Page not found · Lucas Zanoni";
    headingReference.current?.focus({ preventScroll: true });
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div id="top" className="bg-background">
      <LandingHeader />
      <main className="not-found-page" aria-labelledby="not-found-heading">
        <div className="not-found-copy">
          <p className="not-found-kicker">
            <span aria-hidden="true" />
            404 / PAGE NOT FOUND
          </p>
          <h1
            id="not-found-heading"
            ref={headingReference}
            tabIndex={-1}
            className="not-found-heading"
          >
            Well, this is
            <br />
            <span>a dead end.</span>
          </h1>
          <p className="not-found-description">
            Looks like this page wandered off. The good stuff is still here.
            Let’s get you back on the map.
          </p>
          <div className="not-found-actions">
            <Button asChild variant="brand" size="lg">
              <Link to="/">
                <span aria-hidden="true">←</span>
                Take me home
              </Link>
            </Button>
            <Button asChild variant="terminal" size="lg">
              <Link to="/catalog">
                Explore the catalog
                <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
          <p className="not-found-footnote">
            A wrong turn. A perfectly good way back.
          </p>
        </div>
        <NotFoundScene />
      </main>
      <BottomStatusBar />
    </div>
  );
}
