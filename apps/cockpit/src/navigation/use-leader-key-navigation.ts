import { useEffect, useRef } from "react";
import {
  COCKPIT_LEADER_ARM_TIMEOUT_MS,
  cockpitLeaderBindings,
  isCockpitLeaderChord,
  type LeaderCommand,
} from "./leader-keymap";
import {
  initialLeaderEngineState,
  reduceLeaderEngine,
  type LeaderEngineState,
} from "./leader-engine";

export interface LeaderKeyNavigationHandlers {
  readonly onCommand: (command: LeaderCommand) => void;
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function useLeaderKeyNavigation(
  handlers: LeaderKeyNavigationHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  useEffect(() => {
    let engineState: LeaderEngineState = initialLeaderEngineState;
    let armTimeoutId: number | undefined;
    const clearArmTimeout = () => {
      if (armTimeoutId !== undefined) {
        window.clearTimeout(armTimeoutId);
        armTimeoutId = undefined;
      }
    };
    const disarm = () => {
      engineState = reduceLeaderEngine(cockpitLeaderBindings, engineState, {
        kind: "cancel",
      }).state;
      clearArmTimeout();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (engineState.status === "armed") {
        if (MODIFIER_KEYS.has(event.key)) {
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          disarm();
          return;
        }
        const result = reduceLeaderEngine(cockpitLeaderBindings, engineState, {
          kind: "key",
          key: event.key.toLowerCase(),
        });
        engineState = result.state;
        clearArmTimeout();
        if (result.command) {
          event.preventDefault();
          handlersRef.current.onCommand(result.command);
        }
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      if (isCockpitLeaderChord(event)) {
        event.preventDefault();
        engineState = reduceLeaderEngine(cockpitLeaderBindings, engineState, {
          kind: "leader-armed",
        }).state;
        clearArmTimeout();
        armTimeoutId = window.setTimeout(disarm, COCKPIT_LEADER_ARM_TIMEOUT_MS);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearArmTimeout();
    };
  }, []);
}
