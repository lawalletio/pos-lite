// React
import { createContext, useCallback, useContext, useEffect } from "react";

// Types
import type { Event, Sub, UnsignedEvent } from "nostr-tools";

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
  generateZapEvent?: (amountMillisats: number, postEventId?: string) => Event;
  subscribeZap?: (eventId: string, cb: (_event: Event) => void) => Sub;
  publish?: (_event: Event) => Promise<void>;
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
    (amountMillisats: number, postEventId?: string): Event => {
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

  const subscribeZap = (eventId: string, cb: (_event: Event) => void) => {
    console.info(`Listening for zap (${eventId})...`);
    const sub = relayPool.sub([
      {
        kinds: [9735],
        authors: [recipientPubkey!],
        "#e": [eventId],
      },
    ]);

    sub.on("event", cb);

    return sub;
  };

  const publish = async (event: Event) => {
    return await relayPool.publish(event);
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
    <NostrContext.Provider
      value={{
        localPublicKey: LOCAL_PUBLIC_KEY,
        localPrivateKey: LOCAL_PRIVATE_KEY,
        relays,
        generateZapEvent,
        subscribeZap,
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
