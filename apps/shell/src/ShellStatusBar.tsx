import { useLocation } from "react-router-dom";
import { BottomStatusBar } from "@platform/design-system";
import { LandingStatusBar } from "./landing/LandingStatusBar";

const LANDING_ROUTE_PATH = "/";

export function ShellStatusBar() {
  const { pathname } = useLocation();
  return pathname === LANDING_ROUTE_PATH ? (
    <LandingStatusBar />
  ) : (
    <BottomStatusBar />
  );
}
