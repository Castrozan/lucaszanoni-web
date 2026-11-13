export type InferenceRateLimiter = Readonly<{
  limit(options: { key: string }): Promise<{ success: boolean }>;
}>;

export type InferenceAdmissionEnvironment = Readonly<{
  INFERENCE_RATE_LIMITER?: InferenceRateLimiter;
}>;

const unidentifiedVisitorKey = "unidentified-visitor";
const ipv6GroupCount = 8;
const ipv6SubnetPrefixGroupCount = 4;
const ipv6GroupPattern = /^[0-9a-f]{1,4}$/;

export function visitorRateLimitKey(visitorAddress: string | null): string {
  const address = visitorAddress?.trim().toLowerCase();
  if (!address) return unidentifiedVisitorKey;
  if (address.includes(".")) return address.slice(address.lastIndexOf(":") + 1);
  const subnetPrefix = expandIpv6Groups(address)?.slice(
    0,
    ipv6SubnetPrefixGroupCount,
  );
  return subnetPrefix ? `${subnetPrefix.join(":")}::/64` : address;
}

function expandIpv6Groups(address: string): string[] | null {
  const [leadingText = "", trailingText, ...excessHalves] = address.split("::");
  if (excessHalves.length > 0) return null;
  const leading = splitIpv6Groups(leadingText);
  const trailing =
    trailingText === undefined ? null : splitIpv6Groups(trailingText);
  const missingGroupCount =
    ipv6GroupCount - leading.length - (trailing?.length ?? 0);
  if (trailing ? missingGroupCount < 1 : missingGroupCount !== 0) return null;
  const groups = [
    ...leading,
    ...Array<string>(trailing ? missingGroupCount : 0).fill("0"),
    ...(trailing ?? []),
  ];
  if (!groups.every((group) => ipv6GroupPattern.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16).toString(16));
}

function splitIpv6Groups(text: string): string[] {
  return text === "" ? [] : text.split(":");
}

export async function admitVisitorInference(
  environment: InferenceAdmissionEnvironment,
  visitorAddress: string | null,
): Promise<boolean> {
  const limiter = environment?.INFERENCE_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") return false;
  try {
    const outcome = await limiter.limit({
      key: visitorRateLimitKey(visitorAddress),
    });
    return outcome?.success === true;
  } catch {
    return false;
  }
}
