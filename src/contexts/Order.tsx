// React
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Types
import type { Dispatch, SetStateAction } from "react";
import type { Event, UnsignedEvent } from "nostr-tools";
import type { IMenuItem } from "~/types/menu";
import { useLN } from "./LN";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

// Utils
import { useNostr } from "./Nostr";
import {
  calcTotal,
  generateEventContent,
  parseOrderDescription,
  parseZapInvoice,
} from "~/lib/utils";
import { getEventHash, getSignature } from "nostr-tools";

// Interface
export interface IOrderContext {
  orderId?: string;
  amount: number;
  pendingAmount: number;
  totalPaid: number;
  fiatAmount: number;
  fiatCurrency?: string;
  items?: IMenuItem[];
  zapEvents: NDKEvent[];
  currentInvoice?: string;
  setCurrentInvoice?: Dispatch<SetStateAction<string | undefined>>;
  setOrderEvent?: Dispatch<SetStateAction<NDKEvent | undefined>>;
  generateOrderEvent?: (content: unknown) => Event;
  addZapEvent?: (event: NDKEvent) => void;
  setItems?: Dispatch<SetStateAction<IMenuItem[]>>;
  requestZapInvoice?: (
    amountMillisats: number,
    orderEventId: string
  ) => Promise<string>;
}

// Context
export const OrderContext = createContext<IOrderContext>({
  amount: 0,
  pendingAmount: 0,
  totalPaid: 0,
  fiatAmount: 0,
  zapEvents: [],
  fiatCurrency: "ARS",
});

// Component Props
interface IOrderProviderProps {
  children: React.ReactNode;
}

const SAT_ARS_RATE = 0.18;

export const OrderProvider = ({ children }: IOrderProviderProps) => {
  const [orderId, setOrderId] = useState<string>();
  const [orderEvent, setOrderEvent] = useState<NDKEvent>();
  const [amount, setAmount] = useState<number>(0);
  const [currentInvoice, setCurrentInvoice] = useState<string>();
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [fiatCurrency, setFiatCurrency] = useState<string>("ARS");
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [zapEvents, setZapEvents] = useState<NDKEvent[]>([]);

  const { relays, localPublicKey, localPrivateKey, generateZapEvent } =
    useNostr();
  const { requestInvoice } = useLN();

  // on orderEvent change
  useEffect(() => {
    if (!orderEvent) {
      setOrderId(undefined);
      setAmount(0);
      setPendingAmount(0);
      setFiatAmount(0);
      setFiatCurrency("ARS");
      setItems([]);
      return;
    }

    const description = parseOrderDescription(orderEvent as Event);

    setOrderId(orderEvent.id);
    setAmount(description.amount);
    setPendingAmount(description.amount);
    setFiatAmount(description.fiatAmount);
    setFiatCurrency(description.fiatCurrency);
    setItems(description.items);
  }, [orderEvent]);

  // Calculate total on menu change
  useEffect(() => {
    const _total = calcTotal(items);
    setFiatAmount(_total);
    setAmount(Math.round(_total / SAT_ARS_RATE));
  }, [items]);

  const generateOrderEvent = useCallback((): Event => {
    const unsignedEvent: UnsignedEvent = {
      kind: 1,
      content: generateEventContent({
        amount: amount,
        fiatAmount: fiatAmount,
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

  const addZapEvent = useCallback((event: NDKEvent) => {
    const invoice = parseZapInvoice(event as Event);
    if (!invoice.complete) {
      console.info("Incomplete invoice");
      return;
    }
    const amountPaid = parseInt(invoice.millisatoshis!) / 1000;
    setPendingAmount((prev) => prev - amountPaid);
    setTotalPaid((total) => total + amountPaid);
    setZapEvents((prev) => [...prev, event]);
  }, []);

  const requestZapInvoice = useCallback(
    async (amountMillisats: number, orderEventId: string): Promise<string> => {
      // Generate ZapRequestEvent
      const zapEvent = generateZapEvent!(amountMillisats, orderEventId);

      // Request new invoice
      const invoice = await requestInvoice!({
        amountMillisats,
        zapEvent: zapEvent as Event,
      });

      return invoice;
    },
    [generateZapEvent, requestInvoice]
  );

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
        totalPaid,
        currentInvoice,
        setCurrentInvoice,
        requestZapInvoice,
        generateOrderEvent,
        setOrderEvent,
        addZapEvent,
        setItems,
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
