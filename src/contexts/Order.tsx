/* eslint-disable @typescript-eslint/no-unused-vars */
// React
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Types
import {
  getEventHash,
  type Event,
  type UnsignedEvent,
  getSignature,
} from "nostr-tools";
import type { IMenuItem } from "~/types/menu";
import { useNostr } from "./Nostr";

// Interface
export interface IOrderContext {
  orderId?: string;
  amount?: number;
  pendingAmount?: number;
  fiatAmount?: number;
  items?: IMenuItem[];
  zapEvents: Event[];
  generateOrderEvent?: (content: unknown) => Event;
}

// Context
export const OrderContext = createContext<IOrderContext>({
  zapEvents: [],
});

// Component Props
interface IOrderProviderProps {
  children: React.ReactNode;
}

export const OrderProvider = ({ children }: IOrderProviderProps) => {
  const [orderId, setOrderId] = useState<string>();
  const [orderEvent, setOrderEvent] = useState<Event>();
  const [amount, setAmount] = useState<number>();
  const [pendingAmount, setPendingAmount] = useState<number>();
  const [fiatAmount, setFiatAmount] = useState<number>();
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [zapEvents, setZapEvents] = useState<Event[]>([]);

  const { relays, localPublicKey, localPrivateKey } = useNostr();

  useEffect(() => {
    if (!orderEvent) {
      setOrderId(undefined);
      return;
    }

    setOrderId(orderEvent.id);

    // setFiatAmount(fiatAmount);
    // setItems(items);
    // setPendingAmount(pendingAmount);
  }, [orderEvent]);

  const generateOrderEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (content: any): Event => {
      const unsignedEvent: UnsignedEvent = {
        kind: 1,
        content: JSON.stringify(content),
        pubkey: localPublicKey!,
        created_at: Math.round(Date.now() / 1000),
        tags: [
          ["relays", ...relays!],
          ["p", localPublicKey],
        ] as string[][],
      };

      const event: Event = {
        id: getEventHash(unsignedEvent),
        sig: getSignature(unsignedEvent, localPrivateKey!),
        ...unsignedEvent,
      };

      console.info("order: ");
      console.dir(event);

      return event;
    },
    [localPrivateKey, localPublicKey, relays]
  );

  return (
    <OrderContext.Provider
      value={{
        orderId,
        zapEvents,
        amount,
        fiatAmount,
        items,
        pendingAmount,
        generateOrderEvent,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Export hook
export const useOrder = () => {
  return useContext(OrderContext);
};
