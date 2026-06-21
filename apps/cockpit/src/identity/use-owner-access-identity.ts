import { useEffect, useState } from "react";
import {
  readOwnerAccessIdentity,
  type OwnerAccessIdentity,
} from "./owner-access-identity";

export function useOwnerAccessIdentity(): OwnerAccessIdentity | null {
  const [ownerAccessIdentity, setOwnerAccessIdentity] =
    useState<OwnerAccessIdentity | null>(null);
  useEffect(() => {
    let isSubscriptionActive = true;
    readOwnerAccessIdentity().then((identity) => {
      if (isSubscriptionActive) {
        setOwnerAccessIdentity(identity);
      }
    });
    return () => {
      isSubscriptionActive = false;
    };
  }, []);
  return ownerAccessIdentity;
}
