// React
import { createContext, useCallback, useContext, useEffect } from "react";

// Types
import type { Event, UnsignedEvent } from "nostr-tools";

// Utils
import {
  getEventHash,
  getPublicKey,
  getSignature,
  relayInit,
} from "nostr-tools";

// Hooks
import { useLN } from "./LN";

// Interfaces
export interface INostrContext {
  localPublicKey?: string;
  localPrivateKey?: string;
  relays?: string[];
  generateZapEvent?: (
    amountMillisats: number,
    postEventId?: string
  ) => NDKEvent;
  subscribeZap?: (eventId: string) => NDKSubscription;
  getEvent?: (eventId: string) => Promise<NDKEvent | null>;
  publish?: (_event: Event) => Promise<Set<NDKRelay>>;
}

// Context
export const NostrContext = createContext<INostrContext>({});

// Component Props
interface INostrProviderProps {
  children: React.ReactNode;
}

const LOCAL_PRIVATE_KEY = process.env.NEXT_PUBLIC_LOCAL_PRIVATE_KEY!;
const LOCAL_PUBLIC_KEY = getPublicKey(LOCAL_PRIVATE_KEY);

const NOSTR_RELAY = process.env.NEXT_PUBLIC_NOSTR_RELAY!;

const relays = [NOSTR_RELAY];
const relayPool = relayInit(NOSTR_RELAY);

import NDK, {
  NDKEvent,
  type NDKRelay,
  type NDKSubscription,
} from "@nostr-dev-kit/ndk";

const ndk = new NDK({
  explicitRelayUrls: relays,
});

export const NostrProvider = ({ children }: INostrProviderProps) => {
  const { recipientPubkey, destination } = useLN();

  const generateZapEvent = useCallback(
    (amountMillisats: number, postEventId?: string): NDKEvent => {
      const unsignedEvent: UnsignedEvent = {
        kind: 9734,
        content: "",
        pubkey: LOCAL_PUBLIC_KEY,
        created_at: Math.round(Date.now() / 1000),
        tags: [
          ["relays", ...relays],
          ["amount", amountMillisats.toString()],
          ["lnurl", destination],
          ["p", recipientPubkey],
        ] as string[][],
      };

      postEventId && unsignedEvent.tags.push(["e", postEventId]);

      const event = new NDKEvent(ndk, {
        id: getEventHash(unsignedEvent),
        sig: getSignature(unsignedEvent, LOCAL_PRIVATE_KEY),
        ...unsignedEvent,
      });

      console.info("zap event: ");
      console.dir(event);

      return event;
    },
    [destination, recipientPubkey]
  );

  const subscribeZap = (eventId: string): NDKSubscription => {
    console.info(`Listening for zap (${eventId})...`);
    const sub = ndk.subscribe(
      [
        {
          kinds: [9735],
          authors: [recipientPubkey!],
          "#e": [eventId],
          since: 1693157776,
        },
      ],
      {
        closeOnEose: false,
        groupableDelay: 0,
      }
    );
    return sub;
  };

  const getEvent = async (eventId: string): Promise<NDKEvent | null> => {
    return ndk.fetchEvent({
      ids: [eventId],
    });
  };

  const publish = async (event: Event): Promise<Set<NDKRelay>> => {
    const ndkEvent = new NDKEvent(ndk, event);
    return ndkEvent.publish();
    // return await relayPool.publish(event);
  };

  useEffect(() => {
    console.info("Connecting....");
    void ndk.connect().then(() => {
      console.info("Connected");
    });

    return () => {
      console.info("Unsubscribed");
      relayPool.close();
    };
  }, []);

  return (
    <NostrContext.Provider
      value={{
        localPublicKey: LOCAL_PUBLIC_KEY,
        localPrivateKey: LOCAL_PRIVATE_KEY,
        relays,
        generateZapEvent,
        subscribeZap,
        getEvent,
        publish,
      }}
    >
      {children}
    </NostrContext.Provider>
  );
};

// Export hook
export const useNostr = () => {
  return useContext(NostrContext);
};
