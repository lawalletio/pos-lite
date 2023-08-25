// React
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Utils
import { fetchMenuItems } from "~/lib/utils";
import axios from "axios";

// Types
import type { Dispatch, SetStateAction } from "react";
import type { IMenuItem } from "~/types/menu";
import { useLN } from "./LN";
import { useNostr } from "./Nostr";
import { useOrder } from "./Order";

// Interface
export interface IMenuContext {
  menuItems: IMenuItem[];
  invoice?: string;
  setMenuItems?: Dispatch<SetStateAction<IMenuItem[]>>;
  checkOut?: () => Promise<{ invoice: string; eventId: string }>;
}

// Context
export const MenuContext = createContext<IMenuContext>({
  menuItems: [],
});

// Component Props
interface IMenuProviderProps {
  children: React.ReactNode;
}

export const MenuProvider = ({ children }: IMenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [invoice, setInvoice] = useState<string>();

  const { callbackUrl, destination } = useLN();
  const { generateZapEvent, publish } = useNostr();
  const { generateOrderEvent, setItems, amount } = useOrder();

  // Checkout function
  const checkOut = useCallback(async (): Promise<{
    invoice: string;
    eventId: string;
  }> => {
    const amountMillisats = amount * 1000;

    const order = generateOrderEvent!(menuItems);
    await publish!(order);

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
  }, [callbackUrl, destination, amount]);

  // Fetch menu items
  useEffect(() => {
    setMenuItems(fetchMenuItems());
  }, []);

  // Update order items
  useEffect(() => {
    setItems!(menuItems.filter((item) => item.quantity > 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems]);

  return (
    <MenuContext.Provider
      value={{ invoice, menuItems, setMenuItems, checkOut }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// Export hook
export const useMenu = () => {
  return useContext(MenuContext);
};
