/* eslint-disable @next/next/no-img-element */
// React
import React, { useEffect } from "react";

// Types
import type { Event } from "nostr-tools";
import type { NDKEvent, NDKUserProfile } from "@nostr-dev-kit/ndk";

// Utils
import { parseZapInvoice } from "~/lib/utils";

// Hooks
import { useNostr } from "~/contexts/Nostr";

interface ZapProps {
  event: NDKEvent;
}

export default function Zap({ event }: ZapProps) {
  const { ndk } = useNostr();

  const [profile, setProfile] = React.useState<NDKUserProfile>();
  const invoice = parseZapInvoice(event as Event);
  const previousEvent = JSON.parse(
    event.tags.find((tag) => tag[0] === "description")![1]!
  ) as NDKEvent;

  useEffect(() => {
    const profile = ndk.getUser({ hexpubkey: previousEvent.pubkey });
    void profile.fetchProfile().then(() => {
      console.info("profile:");
      console.dir(profile);
      setProfile(profile?.profile);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      key={event.id}
      className="flex flex-row rounded-md border border-solid p-4"
    >
      <div>
        <div>
          <img
            className="h-14 w-14 rounded-full"
            alt={profile?.displayName}
            src={profile?.image}
          />
        </div>
      </div>
      <div className="pl-4">
        <div>{profile?.displayName}</div>
        <div>
          <div className="inline-block rounded-md bg-green-500 p-1">
            +{parseInt(invoice.millisatoshis!) / 1000} sats
          </div>
        </div>

        <div>{previousEvent.content}</div>
      </div>
    </div>
  );
}
