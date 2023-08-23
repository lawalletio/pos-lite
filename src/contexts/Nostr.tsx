// React
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Types
import type { Event, Sub, UnsignedEvent } from "nostr-tools";

// Utils
import {
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  getSignature,
  relayInit,
} from "nostr-tools";

// Hooks
import { useLN } from "./LN";
import { IMenuItem } from "~/types/menu";

// Interfaces
export interface INostrContext {
  generateZapEvent?: (amountMillisats: number) => Event;
  subscribeZap?: (eventId: string, cb: (_event: Event) => void) => Sub;
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

export const NostrProvider = ({ children }: INostrProviderProps) => {
  const { recipientPubkey, destination } = useLN();

  const generateZapEvent = useCallback(
    (amountMillisats: number): Event => {
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

      const event: Event = {
        id: getEventHash(unsignedEvent),
        sig: getSignature(unsignedEvent, LOCAL_PRIVATE_KEY),
        ...unsignedEvent,
      };

      console.info("zap event: ");
      console.dir(event);

      return event;
    },
    [destination, recipientPubkey]
  );

  const generateOrderEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (content: any): Event => {
      const unsignedEvent: UnsignedEvent = {
        kind: 1,
        content: JSON.stringify(content),
        pubkey: LOCAL_PUBLIC_KEY,
        created_at: Math.round(Date.now() / 1000),
        tags: [
          ["relays", ...relays],
          ["p", LOCAL_PUBLIC_KEY],
        ] as string[][],
      };

      const event: Event = {
        id: getEventHash(unsignedEvent),
        sig: getSignature(unsignedEvent, LOCAL_PRIVATE_KEY),
        ...unsignedEvent,
      };

      console.info("order: ");
      console.dir(event);

      return event;
    },
    []
  );

  const subscribeZap = (eventId: string, cb: (_event: Event) => void) => {
    console.info(`Listening for zap (${eventId})...`);
    const sub = relayPool.sub([
      {
        kinds: [9735],
        authors: [recipientPubkey!],
        // "#e": [eventId],
      },
    ]);

    sub.on("event", cb);

    return sub;
  };

  useEffect(() => {
    console.info("Connecting....");
    void relayPool.connect().then(() => {
      console.info("Connected");
    });

    return () => {
      console.info("Unsubscribed");
      relayPool.close();
    };
  }, []);

  return (
    <NostrContext.Provider value={{ generateZapEvent, subscribeZap }}>
      {children}
    </NostrContext.Provider>
  );
};

// Export hook
export const useNostr = () => {
  return useContext(NostrContext);
};
