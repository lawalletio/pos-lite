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

// Types
import type { Dispatch, SetStateAction } from "react";
import type { IMenuItem } from "~/types/menu";
import { useLN } from "./LN";
import { useNostr } from "./Nostr";
import { useOrder } from "./Order";

// Interface
export interface IMenuContext {
  menuItems: IMenuItem[];
  setMenuItems?: Dispatch<SetStateAction<IMenuItem[]>>;
  checkOut?: () => Promise<{ eventId: string }>;
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

  const { callbackUrl, destination } = useLN();
  const { publish } = useNostr();
  const { generateOrderEvent, setItems, amount } = useOrder();

  // Checkout function
  const checkOut = useCallback(async (): Promise<{
    eventId: string;
  }> => {
    // Order Nostr event
    const order = generateOrderEvent!(menuItems);
    await publish!(order);

    return { eventId: order.id };
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
    <MenuContext.Provider value={{ menuItems, setMenuItems, checkOut }}>
      {children}
    </MenuContext.Provider>
  );
};

// Export hook
export const useMenu = () => {
  return useContext(MenuContext);
};
