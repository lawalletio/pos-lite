// React
import { createContext, useCallback, useContext } from "react";

import type { Event, UnsignedEvent } from "nostr-tools";

// Utils
import {
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  getSignature,
} from "nostr-tools";

import { useLN } from "./LN";

// Interface
export interface INostrContext {
  pubkey?: string;
  generateZapEvent?: (amountMillisats: number) => Event;
}

// Context
export const NostrContext = createContext<INostrContext>({});

// Component Props
interface INostrProviderProps {
  children: React.ReactNode;
}

const LOCAL_PRIVATE_KEY = generatePrivateKey();
const LOCAL_PUBLIC_KEY = getPublicKey(LOCAL_PRIVATE_KEY);
const NOSTR_RELAY = process.env.NEXT_PUBLIC_NOSTR_RELAY!;

const relays = [NOSTR_RELAY];

export const NostrProvider = ({ children }: INostrProviderProps) => {
  const { recipientPubkey, destination } = useLN();

  const generateZapEvent = useCallback(
    (amountMillisats: number): Event => {
      console.info("recipientPubkey:", recipientPubkey);

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

      return event;
    },
    [destination, recipientPubkey]
  );

  return (
    <NostrContext.Provider value={{ generateZapEvent }}>
      {children}
    </NostrContext.Provider>
  );
};

// Export hook
export const useNostr = () => {
  return useContext(NostrContext);
};
