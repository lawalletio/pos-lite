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

// Types
import type { Dispatch, SetStateAction } from "react";
import type { IMenuItem } from "~/types/menu";
import type {
  LnUrlRequestInvoiceArgs,
  LnUrlRequestInvoiceResponse,
} from "lnurl-pay/dist/types/types";

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

export const MenuProvider = ({ children }: IMenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [invoice, setInvoice] = useState<LnUrlRequestInvoiceResponse>();

  // Checkout function
  const checkOut =
    useCallback(async (): Promise<LnUrlRequestInvoiceResponse> => {
      const args: LnUrlRequestInvoiceArgs = {
        lnUrlOrAddress: process.env.NEXT_PUBLIC_DESTINATION!,
        tokens: utils.toSats(total),
        comment: "Algo prueba",
      };

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
