import { controlByteForLeaderBinding } from "@platform/design-system";

const LOWEST_ADDRESSABLE_NUMBER = 1;
const HIGHEST_ADDRESSABLE_NUMBER = 9;
const UNSHIFTED_NUMBER_ROW = "123456789";
const SHIFTED_NUMBER_ROW = "!@#$%^&*(";

function chordBytesForNumberRow(
  leaderBinding: string,
  oneBasedNumber: number,
  numberRow: string,
): Uint8Array | null {
  const controlByte = controlByteForLeaderBinding(leaderBinding);
  if (
    controlByte === null ||
    !Number.isInteger(oneBasedNumber) ||
    oneBasedNumber < LOWEST_ADDRESSABLE_NUMBER ||
    oneBasedNumber > HIGHEST_ADDRESSABLE_NUMBER
  ) {
    return null;
  }
  return new Uint8Array([
    controlByte,
    numberRow.charCodeAt(oneBasedNumber - LOWEST_ADDRESSABLE_NUMBER),
  ]);
}

export function windowJumpChordBytes(
  leaderBinding: string,
  oneBasedWindowNumber: number,
): Uint8Array | null {
  return chordBytesForNumberRow(
    leaderBinding,
    oneBasedWindowNumber,
    UNSHIFTED_NUMBER_ROW,
  );
}

export function sessionJumpChordBytes(
  leaderBinding: string,
  oneBasedSessionNumber: number,
): Uint8Array | null {
  return chordBytesForNumberRow(
    leaderBinding,
    oneBasedSessionNumber,
    SHIFTED_NUMBER_ROW,
  );
}
