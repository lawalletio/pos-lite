import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { fetchMenuItems, calcTotal } from "~/lib/utils";
import type { IMenuItem } from "~/types/menu";

export interface IMenuContext {
  total: number;
  menuItems: IMenuItem[];
  setMenuItems: Dispatch<SetStateAction<IMenuItem[]>>;
}

export const MenuContext = createContext<IMenuContext>({});

interface IMenuProviderProps {
  children: React.ReactNode;
}

export const MenuProvider = ({ children }: IMenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setMenuItems(fetchMenuItems());
  }, []);

  useEffect(() => {
    setTotal(calcTotal(menuItems));
  }, [menuItems]);

  return (
    <MenuContext.Provider value={{ total, menuItems, setMenuItems }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  return useContext(MenuContext);
};
