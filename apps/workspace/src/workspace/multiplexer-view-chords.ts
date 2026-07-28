import { controlByteForLeaderBinding } from "@platform/design-system";

const LOWEST_ADDRESSABLE_NUMBER = 1;
const HIGHEST_ADDRESSABLE_NUMBER = 9;
const UNSHIFTED_NUMBER_ROW = "123456789";

export function windowJumpChordBytes(
  leaderBinding: string,
  oneBasedWindowNumber: number,
): Uint8Array | null {
  const controlByte = controlByteForLeaderBinding(leaderBinding);
  if (
    controlByte === null ||
    !Number.isInteger(oneBasedWindowNumber) ||
    oneBasedWindowNumber < LOWEST_ADDRESSABLE_NUMBER ||
    oneBasedWindowNumber > HIGHEST_ADDRESSABLE_NUMBER
  ) {
    return null;
  }
  return new Uint8Array([
    controlByte,
    UNSHIFTED_NUMBER_ROW.charCodeAt(
      oneBasedWindowNumber - LOWEST_ADDRESSABLE_NUMBER,
    ),
  ]);
}
