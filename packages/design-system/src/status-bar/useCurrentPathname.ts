import { useEffect, useState } from "react";

export function useCurrentPathname(): string {
  const [pathname, setPathname] = useState("/");
  useEffect(() => {
    function syncPathname() {
      setPathname(window.location.pathname);
    }
    syncPathname();
    window.addEventListener("popstate", syncPathname);
    return () => {
      window.removeEventListener("popstate", syncPathname);
    };
  }, []);
  return pathname;
}
