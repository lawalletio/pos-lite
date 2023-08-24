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
import axios from "axios";

// Types
import type { Dispatch, SetStateAction } from "react";
import type { IMenuItem } from "~/types/menu";
import { useLN } from "./LN";
import { useNostr } from "./Nostr";

// Interface
export interface IMenuContext {
  total: number;
  totalSats: number;
  menuItems: IMenuItem[];
  invoice?: string;
  setMenuItems?: Dispatch<SetStateAction<IMenuItem[]>>;
  checkOut?: () => Promise<{ invoice: string; eventId: string }>;
}

// Context
export const MenuContext = createContext<IMenuContext>({
  total: 0,
  totalSats: 0,
  menuItems: [],
});

// Component Props
interface IMenuProviderProps {
  children: React.ReactNode;
}

const SAT_ARS_RATE = 0.18;

export const MenuProvider = ({ children }: IMenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalSats, setTotalSats] = useState<number>(0);
  const [invoice, setInvoice] = useState<string>();

  const { callbackUrl, destination } = useLN();
  const { generateZapEvent, generateOrderEvent } = useNostr();

  // Checkout function
  const checkOut = useCallback(async (): Promise<{
    invoice: string;
    eventId: string;
  }> => {
    const amountMillisats = totalSats * 1000;

    const order = generateOrderEvent!(menuItems);

    const zapEvent = generateZapEvent!(amountMillisats, order.id);
    const encodedZapEvent = encodeURI(JSON.stringify(zapEvent));

    const response = await axios.get(
      `${callbackUrl}?amount=${amountMillisats}&nostr=${encodedZapEvent}&lnurl=${destination}`
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const invoice = response.data.pr as string;
    setInvoice(invoice);

    return { invoice, eventId: order.id };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callbackUrl, destination, totalSats]);

  // Fetch menu items
  useEffect(() => {
    setMenuItems(fetchMenuItems());
  }, []);

  // Calculate total on menu change
  useEffect(() => {
    const _total = calcTotal(menuItems);
    setTotal(_total);
    setTotalSats(_total * SAT_ARS_RATE);
  }, [menuItems]);

  return (
    <MenuContext.Provider
      value={{ total, totalSats, invoice, menuItems, setMenuItems, checkOut }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// Export hook
export const useMenu = () => {
  return useContext(MenuContext);
};
