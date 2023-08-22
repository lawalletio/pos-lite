// React
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Utils
import { fetchMenuItems, calcTotal } from "~/lib/utils";
import { utils } from "lnurl-pay";
import { requestInvoice } from "lnurl-pay";
import {
  generatePrivateKey,
  getPublicKey,
  getSignature,
  getEventHash,
} from "nostr-tools";

// Types
import type { Dispatch, SetStateAction } from "react";
import type { IMenuItem } from "~/types/menu";
import type {
  LnUrlRequestInvoiceArgs,
  LnUrlRequestInvoiceResponse,
} from "lnurl-pay/dist/types/types";
import type { UnsignedEvent, Event } from "nostr-tools";

// Interface
export interface IMenuContext {
  total: number;
  menuItems: IMenuItem[];
  invoice?: LnUrlRequestInvoiceResponse;
  setMenuItems: Dispatch<SetStateAction<IMenuItem[]>>;
  checkOut: () => Promise<LnUrlRequestInvoiceResponse>;
}

// Context
export const MenuContext = createContext<IMenuContext>({
  total: 0,
  menuItems: [],
  setMenuItems: function (_value: SetStateAction<IMenuItem[]>): void {
    throw new Error("Function not implemented.");
  },
  checkOut: function (): Promise<LnUrlRequestInvoiceResponse> {
    throw new Error("Function not implemented.");
  },
});

// Component Props
interface IMenuProviderProps {
  children: React.ReactNode;
}

const DESTINATION_LNURL = process.env.NEXT_PUBLIC_DESTINATION!;
const NOSTR_RELAY = process.env.NEXT_PUBLIC_NOSTR_RELAY!;

export const MenuProvider = ({ children }: IMenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [invoice, setInvoice] = useState<LnUrlRequestInvoiceResponse>();

  // Checkout function
  const checkOut =
    useCallback(async (): Promise<LnUrlRequestInvoiceResponse> => {
      const args: LnUrlRequestInvoiceArgs = {
        lnUrlOrAddress: DESTINATION_LNURL,
        tokens: utils.toSats(total),
        comment: "Algo prueba",
      };

      const receipientPubkey = "asdasd";
      const relays = [NOSTR_RELAY];

      // This POS
      const senderPrivkey = generatePrivateKey();
      const senderPubkey = getPublicKey(senderPrivkey);

      const unsignedEvent: UnsignedEvent = {
        kind: 9734,
        content: "",
        pubkey: senderPubkey,
        created_at: Math.round(Date.now() / 1000),
        tags: [
          ["relays", ...relays],
          ["amount", total.toString()],
          ["lnurl", DESTINATION_LNURL],
          ["p", receipientPubkey],
        ] as string[][],
      };

      const event: Event = {
        id: getEventHash(unsignedEvent),
        sig: getSignature(unsignedEvent, senderPrivkey),
        ...unsignedEvent,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const encodedEvent = encodeURI(JSON.stringify(event));

      const invoice: LnUrlRequestInvoiceResponse = await requestInvoice(args);
      setInvoice(invoice);
      return invoice;
    }, [total]);

  // Fetch menu items
  useEffect(() => {
    setMenuItems(fetchMenuItems());
  }, []);

  // Calculate total on menu change
  useEffect(() => {
    setTotal(calcTotal(menuItems));
  }, [menuItems]);

  return (
    <MenuContext.Provider
      value={{ total, invoice, menuItems, setMenuItems, checkOut }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// Export hook
export const useMenu = () => {
  return useContext(MenuContext);
};
