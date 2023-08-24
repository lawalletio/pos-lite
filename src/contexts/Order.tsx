// React
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Tools
import { useNostr } from "./Nostr";
import {
  generateEventContent,
  parseOrderDescription,
  parseZapInvoice,
} from "~/lib/utils";
import { getEventHash, getSignature } from "nostr-tools";

// Types
import type { Dispatch, SetStateAction } from "react";
import type { Event, UnsignedEvent } from "nostr-tools";
import type { IMenuItem } from "~/types/menu";

// Interface
export interface IOrderContext {
  orderId?: string;
  amount?: number;
  pendingAmount?: number;
  fiatAmount?: number;
  fiatCurrency?: string;
  items?: IMenuItem[];
  zapEvents: Event[];
  setOrderEvent?: Dispatch<SetStateAction<Event | undefined>>;
  generateOrderEvent?: (content: unknown) => Event;
  addZapEvent?: (event: Event) => void;
}

// Context
export const OrderContext = createContext<IOrderContext>({
  zapEvents: [],
  fiatCurrency: "ARS",
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
  const [fiatCurrency, setFiatCurrency] = useState<string>("ARS");
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [zapEvents, setZapEvents] = useState<Event[]>([]);

  const { relays, localPublicKey, localPrivateKey } = useNostr();

  // on orderEvent change
  useEffect(() => {
    if (!orderEvent) {
      setOrderId(undefined);
      setAmount(undefined);
      setPendingAmount(undefined);
      setFiatAmount(undefined);
      setFiatCurrency("ARS");
      setItems([]);
      return;
    }

    const description = parseOrderDescription(orderEvent);

    setOrderId(orderEvent.id);
    setAmount(description.amount);
    setPendingAmount(description.amount);
    setFiatAmount(description.fiatAmount);
    setFiatCurrency(description.fiatCurrency);
    setItems(description.items);
  }, [orderEvent]);

  const generateOrderEvent = useCallback((): Event => {
    const unsignedEvent: UnsignedEvent = {
      kind: 1,
      content: generateEventContent({
        amount: amount!,
        fiatAmount: fiatAmount!,
        fiatCurrency,
        items,
      }),
      pubkey: localPublicKey!,
      created_at: Math.round(Date.now() / 1000),
      tags: [
        ["relays", ...relays!],
        ["p", localPublicKey],
        [
          "description",
          JSON.stringify({
            items,
            fiatAmount,
            fiatCurrency,
            amount,
          }),
        ],
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
  }, [
    amount,
    fiatAmount,
    fiatCurrency,
    items,
    localPrivateKey,
    localPublicKey,
    relays,
  ]);

  const addZapEvent = useCallback((event: Event) => {
    const invoice = parseZapInvoice(event);
    if (!invoice.complete) {
      return;
    }
    setPendingAmount((prev) => prev! - parseInt(invoice.millisatoshis!) / 1000);
    setZapEvents((prev) => [...prev, event]);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orderId,
        zapEvents,
        amount,
        fiatAmount,
        fiatCurrency,
        items,
        pendingAmount,
        generateOrderEvent,
        setOrderEvent,
        addZapEvent,
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
